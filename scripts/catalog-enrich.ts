import { prisma } from "@/lib/prisma";
import { TheWatchApiClient } from "@/lib/catalog/thewatchapi-client";

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

async function markReferencesAsChecked(referenceNumbers: string[]) {
  if (!referenceNumbers.length) return 0;

  const result = await prisma.watchReference.updateMany({
    where: {
      referenceNumber: {
        in: referenceNumbers,
      },
    },
    data: {
      lastSyncedAt: new Date(),
    },
  });

  return result.count;
}

async function runReferenceEnrichment() {
  const client = new TheWatchApiClient();

  const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000);

  const refs = await prisma.watchReference.findMany({
    where: {
      OR: [
        { modelId: null },
        { description: null }
      ],
      AND: [
        {
          OR: [
            { lastSyncedAt: null },
            { lastSyncedAt: { lt: cutoff } }
          ]
        },
        {
          OR: [
            { model: null },
            { model: { updatedAt: { lt: cutoff } } }
          ]
        }
      ]
    },
    include: {
      brand: true,
      model: true
    },
    take: 200,
    orderBy: {
      id: "asc"
    }
  });

  console.log(`Enriching ${refs.length} references`);

  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const ref of refs) {
    await sleep(1000);

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

        console.log(`No data for ${ref.referenceNumber} (marked as checked)`);
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
          modelId: matchedModel?.id ?? null,
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
      console.log(`Error enriching ${ref.referenceNumber}:`, getErrorMessage(err));
      failedCount += 1;
    }
  }

  console.log("Reference enrichment finished");
  console.log(
    `Summary: updated=${updatedCount}, skipped=${skippedCount}, failed=${failedCount}`
  );
}

/**
 * Optional one-time manual bump for references that returned no data
 * in your last run, so they are skipped for the next 36 hours.
 */
async function markLatestNoDataReferences() {
  const noDataReferenceNumbers = [
    "A13317",
    "A13324",
    "A13330",
    "A13341",
    "A13352",
    "A13355",
    "A13363",
    "A13380",
    "A13385",
    "A13388",
    "A17035",
    "A17040",
    "A17316",
    "A17318101B1X1",
    "A17318101C1A1",
    "A17319",
    "A17319101I1A1",
    "A17319101I1X1",
    "A1732024",
    "A17328101B1A1",
    "A17328101B1X1",
    "A17329161C1A1",
    "A17329161C1P1",
    "A17329171C1A1",
    "A17329171C1P1",
    "A17366",
    "A17366D71O1S1",
    "A17367",
    "A17367D81C1A1",
    "A17367D81C1S2",
    "A17380",
    "A17388",
    "A17395361L1A1",
    "A19380",
    "A21330",
    "A24315101C1X2",
    "A24322121B2A1",
    "A32310171C1A1",
    "A32310211G1P1",
    "A32310251B1A1",
    "A32310251B1P1",
    "A32397101A1A1",
    "A35360",
    "A41330",
    "A44355",
    "A45340211G1P2",
    "A68362",
    "A73350",
    "A73380",
    "A73388",
    "A74380",
    "A74388",
    "AB01192A1L1A1",
    "AB0127",
    "AB0145221B1P1",
    "AB0147101A1X1",
    "AB0147101C1X1",
    "AB01762A1L1X1",
    "AB0410",
    "AB0420",
    "AB2020121L1A1",
    "AB2020121L1S1",
    "C13356",
    "CB0140",
    "E79362",
    "E79363",
    "EB0134101M1E1",
    "EB0134101M1S1",
    "EB0136251M1E1",
    "EB0136251M1S1",
    "EB2040101L1X1",
    "F56062",
    "K44362",
    "N17376",
    "N17376201Q1S1",
    "PB0136251C1S1",
    "RB0138211B1P1",
    "RB0311E61F1P1",
    "RB0431",
    "SB0147101B1X1",
    "U13324211B1X1",
    "U17395211A1U1",
    "UB0134",
    "UB0134101B1U1",
    "UB0134101C1U1",
    "UB0136251L1U1",
    "UB2010121B1S1",
    "UB2010161C1S1",
    "V13317101B1X1",
    "V13317101B1X2",
    "V13317101L1X1",
    "V13375101C1X2",
    "V17310",
    "V17319101B1X2",
    "V76325",
    "VB5010",
    "X823101B1B1S1",
    "X82310D31B1S1",
    "0907",
    "1057917",
    "1310",
    "1566",
    "166921",
    "1710",
    "183964",
    "1840",
    "187903",
    "187949",
    "1954",
    "2301",
    "2403",
    "2405",
    "2412",
    "2442",
    "2524",
    "2740",
    "2960",
    "2966",
    "3217",
    "3284",
    "3514",
    "3515",
    "3802",
    "4324",
    "681006",
    "78086",
    "78087",
    "8839",
    "887968",
    "987901",
    "W10184U2",
    "W1556368",
    "W20011C4",
    "W20012C4",
    "W20040D6",
    "W20056D6",
    "W2006951",
    "W20076X8",
    "W20098D6",
    "W20106X8",
    "W25014B9",
    "W25022B9",
    "W2603156",
    "W2607456",
    "W2BB0012",
    "W2PN0006",
    "W2PN0007",
    "W2SA0017",
    "W31015M7",
    "W3PN0006",
    "W4BB0023",
    "W4SA0005",
    "W4TA0008",
    "W5000256",
    "W50002N2",
    "W51007Q4",
    "W51027Q4",
    "W5200002",
    "W5200004",
    "W5200013",
    "W5200014",
  ];

  const updated = await markReferencesAsChecked(noDataReferenceNumbers);
  console.log(`Manually marked ${updated} references as checked`);
}

// Uncomment this if you want to do the one-time manual update first:
// markLatestNoDataReferences()
// runReferenceEnrichment()

runReferenceEnrichment()
  .catch(console.error)
  .finally(() => prisma.$disconnect());