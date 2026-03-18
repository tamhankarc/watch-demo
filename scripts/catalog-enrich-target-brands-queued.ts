import { prisma } from "@/lib/prisma";
import { TheWatchApiClient } from "@/lib/catalog/thewatchapi-client";

const TARGET_BRANDS = ["Rolex", "Patek Philippe", "Tudor"] as const;
const JOB_NAME = "target-brand-enrichment";
const DAILY_QUOTA = 180;
const DELAY_MS = 1000;
const BATCH_SIZE = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
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
        message.includes("rate_limit_reached") || message.includes("429");

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

async function getRunState() {
  const today = startOfToday();

  let state = await prisma.enrichmentRunState.findUnique({
    where: { jobName: JOB_NAME },
  });

  if (!state) {
    state = await prisma.enrichmentRunState.create({
      data: {
        jobName: JOB_NAME,
        lastReferenceId: null,
        dailyQuota: DAILY_QUOTA,
        usedToday: 0,
        quotaDate: today,
      },
    });
  }

  const quotaDate = new Date(state.quotaDate);
  quotaDate.setHours(0, 0, 0, 0);

  if (quotaDate.getTime() !== today.getTime()) {
    state = await prisma.enrichmentRunState.update({
      where: { jobName: JOB_NAME },
      data: {
        usedToday: 0,
        quotaDate: today,
      },
    });
  }

  return state;
}

async function main() {
  const client = new TheWatchApiClient();
  const state = await getRunState();

  const remaining = state.dailyQuota - state.usedToday;
  if (remaining <= 0) {
    console.log(`Daily quota exhausted. usedToday=${state.usedToday}, dailyQuota=${state.dailyQuota}`);
    return;
  }

  console.log(
    `Starting queued enrichment. remaining=${remaining}, lastReferenceId=${state.lastReferenceId ?? "none"}`
  );

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
            { lastSyncedAt: { lt: startOfToday() } },
          ],
        },
        state.lastReferenceId
          ? { id: { gt: state.lastReferenceId } }
          : {},
      ],
    },
    include: {
      brand: true,
      model: true,
    },
    take: Math.min(BATCH_SIZE, remaining),
    orderBy: { id: "asc" },
  });

  if (!refs.length) {
    console.log("No more eligible references found after current cursor. Resetting cursor to start.");
    await prisma.enrichmentRunState.update({
      where: { jobName: JOB_NAME },
      data: { lastReferenceId: null },
    });
    return;
  }

  let usedThisRun = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let lastProcessedId: number | null = null;

  for (const ref of refs) {
    if (usedThisRun >= remaining) break;

    await sleep(DELAY_MS);

    try {
      const payload = await fetchWithRetry(
        () => client.searchModelByReference(ref.referenceNumber),
        ref.referenceNumber
      );

      usedThisRun += 1;
      lastProcessedId = ref.id;

      const items = payload.data ?? payload;

      if (!Array.isArray(items) || items.length === 0) {
        await prisma.watchReference.update({
          where: { id: ref.id },
          data: { lastSyncedAt: new Date() },
        });

        console.log(`No data for ${ref.referenceNumber} (marked checked)`);
        skippedCount += 1;
      } else {
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
      }
    } catch (err) {
      lastProcessedId = ref.id;
      console.log(`Error enriching ${ref.referenceNumber}: ${getErrorMessage(err)}`);
      failedCount += 1;
    }
  }

  await prisma.enrichmentRunState.update({
    where: { jobName: JOB_NAME },
    data: {
      lastReferenceId: lastProcessedId,
      usedToday: {
        increment: usedThisRun,
      },
    },
  });

  console.log("Queued enrichment finished");
  console.log(
    `Summary: updated=${updatedCount}, skipped=${skippedCount}, failed=${failedCount}, apiUsed=${usedThisRun}`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());