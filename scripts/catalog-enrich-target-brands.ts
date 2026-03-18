import { prisma } from "@/lib/prisma";
import { TheWatchApiClient } from "@/lib/catalog/thewatchapi-client";

const TARGET_BRANDS = ["Rolex", "Patek Philippe", "Tudor"] as const;
const BATCH_SIZE = 5;
const DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  referenceNumber: string,
  maxRetries = 5
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      const message = getErrorMessage(err);

      const isRateLimit =
        message.includes("rate_limit_reached") ||
        message.includes("429");

      if (!isRateLimit || attempt > maxRetries) {
        throw err;
      }

      const waitMs = 60000;
      console.log(
        `Rate limit hit for ${referenceNumber}. Retry ${attempt}/${maxRetries} after ${waitMs / 1000}s`
      );
      await sleep(waitMs);
    }
  }
}

async function runBrandTargetedEnrichment() {
  const client = new TheWatchApiClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const refs = await prisma.watchReference.findMany({
    where: {
      brand: {
        name: {
          in: [...TARGET_BRANDS],
        },
      },
      OR: [
        { modelId: null },
        { description: null },
        { movement: null },
        { caseMaterial: null },
      ],
      AND: [
        {
          OR: [
            { lastSyncedAt: null },
            { lastSyncedAt: { lt: startOfToday } },
          ],
        },
      ],
    },
    include: {
      brand: true,
      model: true,
    },
    take: BATCH_SIZE,
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Targeted enrichment: ${refs.length} references for ${TARGET_BRANDS.join(", ")}`
  );

  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const ref of refs) {
    await sleep(DELAY_MS);

    try {
      const payload = await fetchWithRetry(
        () => client.searchModelByReference(ref.referenceNumber),
        ref.referenceNumber
      );

      const items = payload.data ?? payload;

      if (!Array.isArray(items) || items.length === 0) {
        await prisma.watchReference.update({
          where: { id: ref.id },
          data: {
            lastSyncedAt: new Date(),
          },
        });

        console.log(`No data for ${ref.referenceNumber} (marked checked)`);
        skippedCount += 1;
        continue;
      }

      const item = items[0];

      const modelName =
        typeof item?.model === "string" ? item.model.trim() : null;

      const matchedModel = modelName
        ? await prisma.model.findFirst({
            where: {
              brandId: ref.brandId,
              name: modelName,
            },
          })
        : null;

      await prisma.watchReference.update({
        where: { id: ref.id },
        data: {
          modelId: matchedModel?.id ?? ref.modelId ?? null,
          displayName: modelName || ref.displayName,
          description: item?.description ?? ref.description,
          movement: item?.movement ?? ref.movement,
          caseMaterial: item?.case_material ?? ref.caseMaterial,
          dialColor: item?.dial_color ?? ref.dialColor,
          braceletMaterial: item?.bracelet_material ?? ref.braceletMaterial,
          caseSizeMm: item?.case_diameter
            ? parseFloat(String(item.case_diameter).replace(/[^\d.]/g, ""))
            : ref.caseSizeMm,
          productionYearStart: item?.year_of_production
            ? Number(item.year_of_production) || ref.productionYearStart
            : ref.productionYearStart,
          lastSyncedAt: new Date(),
        },
      });

      console.log(
        `Updated ${ref.referenceNumber}${matchedModel ? ` -> ${matchedModel.name}` : " (no model match)"}`
      );
      updatedCount += 1;
    } catch (err) {
      console.log(
        `Error enriching ${ref.referenceNumber}:`,
        getErrorMessage(err)
      );
      failedCount += 1;
    }
  }

  console.log("Targeted reference enrichment finished");
  console.log(
    `Summary: updated=${updatedCount}, skipped=${skippedCount}, failed=${failedCount}`
  );
}

runBrandTargetedEnrichment()
  .catch(console.error)
  .finally(() => prisma.$disconnect());