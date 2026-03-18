import { prisma } from "@/lib/prisma";
import { TheWatchApiClient } from "@/lib/catalog/thewatchapi-client";

const BRAND_CANDIDATES: Record<string, string[]> = {
  "Rolex": ["rolex"],
  "Patek Philippe": ["patek", "patek philippe", "patek-philippe"],
  "Tudor": ["tudor"],
};

function normalizeReferenceNumber(value: unknown) {
  return String(value ?? "").trim();
}

async function resolveWorkingBrandKey(
  client: TheWatchApiClient,
  displayName: string,
  candidates: string[]
) {
  for (const candidate of candidates) {
    try {
      const payload = await client.listReferencesByBrand(candidate);
      const refs = payload?.data ?? payload;

      if (Array.isArray(refs)) {
        console.log(
          `Resolved API brand key for ${displayName}: ${candidate} (${refs.length} refs returned)`
        );
        return {
          apiBrandKey: candidate,
          refs,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Brand key failed for "${displayName}": ${candidate} -> ${message}`);
    }
  }

  return null;
}

async function importBrandReferences(displayName: string) {
  const client = new TheWatchApiClient();

  const brand = await prisma.brand.findFirst({
    where: { name: displayName },
  });

  if (!brand) {
    throw new Error(`Brand not found in DB: ${displayName}`);
  }

  const candidates = BRAND_CANDIDATES[displayName];
  if (!candidates?.length) {
    throw new Error(`No API brand candidates configured for ${displayName}`);
  }

  const resolved = await resolveWorkingBrandKey(client, displayName, candidates);

  if (!resolved) {
    console.log(`No working API brand key found for ${displayName}`);
    return {
      displayName,
      imported: 0,
      skipped: 0,
      apiBrandKey: null,
    };
  }

  let imported = 0;
  let skipped = 0;

  for (const rawRef of resolved.refs) {
    const referenceNumber = normalizeReferenceNumber(rawRef);

    if (!referenceNumber) {
      skipped += 1;
      continue;
    }

    // First try exact existing shell by brand+reference
    const existingByBrandRef = await prisma.watchReference.findFirst({
      where: {
        brandId: brand.id,
        referenceNumber,
      },
      select: {
        id: true,
      },
    });

    if (existingByBrandRef) {
      await prisma.watchReference.update({
        where: { id: existingByBrandRef.id },
        data: {
          displayName: referenceNumber,
          lastSyncedAt: new Date(),
          isActive: true,
        },
      });

      skipped += 1;
      continue;
    }

    await prisma.watchReference.create({
      data: {
        brandId: brand.id,
        modelId: null,
        referenceNumber,
        displayName: referenceNumber,
        externalId: `${resolved.apiBrandKey}:${referenceNumber}`,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });

    imported += 1;
  }

  return {
    displayName,
    imported,
    skipped,
    apiBrandKey: resolved.apiBrandKey,
  };
}

async function main() {
  const targets = ["Rolex", "Patek Philippe", "Tudor"] as const;

  for (const brandName of targets) {
    const result = await importBrandReferences(brandName);
    console.log(
      `[${brandName}] apiBrandKey=${result.apiBrandKey ?? "none"} imported=${result.imported} skipped=${result.skipped}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });