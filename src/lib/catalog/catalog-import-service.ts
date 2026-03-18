import { prisma } from '@/lib/prisma';
import { TheWatchApiClient } from './thewatchapi-client';
import { mapModel, mapReference } from './catalog-mappers';

const ALLOWED_BRANDS: Record<string, string[]> = {
  "Rolex": ["rolex"],
  "Patek Philippe": ["patek", "patek philippe", "patek-philippe"],
  "Breitling": ["breitling"],
  "Cartier": ["cartier"],
  "Panerai": ["panerai"],
  "Tudor": ["tudor"]
};

async function resolveWorkingBrandKey(
  client: TheWatchApiClient,
  displayName: string,
  candidates: string[]
) {
  for (const candidate of candidates) {
    try {
      const payload = await client.listModelsByBrand(candidate);
      return {
        apiBrandKey: candidate,
        modelsPayload: payload
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Brand key failed for "${displayName}": ${candidate} -> ${message}`);
    }
  }

  throw new Error(`No valid API brand key found for ${displayName}`);
}

export async function runFullCatalogSync() {
  const client = new TheWatchApiClient();

  const syncRun = await prisma.catalogSyncRun.create({
    data: {
      sourceCode: 'THEWATCHAPI',
      runType: 'FULL',
      status: 'STARTED',
      startedAt: new Date()
    }
  });

  try {
    const brandsPayload = await client.listBrands();
    const brands = brandsPayload.data ?? brandsPayload;

    for (const brandPayload of brands) {
      console.log("Brand payload:", brandPayload);

      const displayName =
        typeof brandPayload === "string"
          ? brandPayload
          : brandPayload?.name || brandPayload?.brand || null;

      if (!displayName) {
        console.warn("Skipping invalid brand payload:", brandPayload);
        continue;
      }

      const candidates = ALLOWED_BRANDS[displayName];

      if (!candidates) {
        console.log(`Skipping unsupported brand: ${displayName}`);
        continue;
      }

      const { apiBrandKey, modelsPayload } = await resolveWorkingBrandKey(
        client,
        displayName,
        candidates
      );

      console.log(`Using API brand key for ${displayName}: ${apiBrandKey}`);

      const brandMap = {
        name: displayName,
        slug: apiBrandKey,
        externalId: apiBrandKey
      };

      let brand = await prisma.brand.findUnique({
        where: { externalId: brandMap.externalId }
      });

      if (!brand) {
        brand = await prisma.brand.findUnique({
          where: { name: brandMap.name }
        });
      }

      if (brand) {
        brand = await prisma.brand.update({
          where: { id: brand.id },
          data: {
            name: brandMap.name,
            slug: brandMap.slug,
            externalId: brandMap.externalId,
            isActive: true
          }
        });
      } else {
        brand = await prisma.brand.create({
          data: {
            name: brandMap.name,
            slug: brandMap.slug,
            externalId: brandMap.externalId,
            isActive: true
          }
        });
      }

      const models = modelsPayload.data ?? modelsPayload;

      for (const modelPayload of models) {
        console.log("Model payload:", modelPayload);

        const modelMap = mapModel(modelPayload, brand.id);

        if (!modelMap) {
          console.log("Skipping invalid/empty model payload:", modelPayload);
          continue;
        }

        await prisma.model.upsert({
          where: { externalId: modelMap.externalId },
          update: {
            name: modelMap.name,
            slug: modelMap.slug,
            brandId: brand.id,
            isActive: true
          },
          create: {
            ...modelMap,
            isActive: true
          }
        });
      }

      // Reference sync should be handled separately,
      // once we confirm how to map references to a specific model safely.
    }

    await prisma.catalogSyncRun.update({
      where: { id: syncRun.id },
      data: { status: 'SUCCESS', endedAt: new Date() }
    });
  } catch (error) {
    await prisma.catalogSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: 'FAILED',
        endedAt: new Date(),
        errorLog: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    throw error;
  }
}

export async function enrichReferenceCatalog() {
  const client = new TheWatchApiClient();

  const refs = await prisma.watchReference.findMany({
    where: {
      OR: [
        { modelId: null },
        { description: null }
      ]
    },
    include: {
      brand: true
    }
  });

  for (const ref of refs) {
    const payload = await client.searchModelByReference(ref.referenceNumber);
    const items = payload.data ?? payload;

    if (!Array.isArray(items) || items.length === 0) {
      console.log(`No details found for ref ${ref.referenceNumber}`);
      continue;
    }

    const best = items[0];

    const matchedModel = await prisma.model.findFirst({
      where: {
        brandId: ref.brandId,
        name: best.model
      }
    });

    await prisma.watchReference.update({
      where: { id: ref.id },
      data: {
        modelId: matchedModel?.id ?? ref.modelId,
        displayName: best.model || ref.displayName,
        description: best.description || ref.description,
        movement: best.movement || ref.movement,
        caseMaterial: best.case_material || ref.caseMaterial,
        caseSizeMm: best.case_diameter
          ? parseFloat(String(best.case_diameter).replace(/[^\d.]/g, ""))
          : ref.caseSizeMm,
        externalId: ref.externalId || ref.referenceNumber,
        lastSyncedAt: new Date(),
        isActive: true
      }
    });
  }
}