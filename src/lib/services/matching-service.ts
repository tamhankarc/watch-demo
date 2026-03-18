import { prisma } from '@/lib/prisma';

export type MatchSuggestion = {
  stockItemId: number;
  score: number;
  reason: string[];
  serialNumber: string;
  brandName: string;
  modelName: string;
  referenceNumber: string | null;
};

export async function getBestStockSuggestionsForRequirement(requirementId: number) {
  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    include: { brand: true, model: true, watchReference: true },
  });
  if (!requirement) throw new Error('Requirement not found.');

  const stock = await prisma.stockItem.findMany({
    where: { currentStatus: 'AVAILABLE', isActive: true, brandId: requirement.brandId },
    include: { brand: true, model: true, watchReference: true },
    take: 200,
  });

  const suggestions: MatchSuggestion[] = stock.map((item) => {
    let score = 50;
    const reason = ['Brand match'];

    if (requirement.modelId && item.modelId === requirement.modelId) {
      score += 30;
      reason.push('Model match');
    } else if (!requirement.modelId) {
      score += 10;
      reason.push('Brand-only requirement');
    }

    if (requirement.watchReferenceId && item.watchReferenceId === requirement.watchReferenceId) {
      score += 100;
      reason.push('Exact reference match');
    } else if (!requirement.watchReferenceId && item.watchReferenceId) {
      score += 5;
      reason.push('Reference available');
    }

    return {
      stockItemId: item.id,
      score,
      reason,
      serialNumber: item.serialNumber,
      brandName: item.brand.name,
      modelName: item.model.name,
      referenceNumber: item.watchReference?.referenceNumber ?? null,
    };
  }).sort((a, b) => b.score - a.score);

  return { requirement, suggestions: suggestions.slice(0, 20) };
}
