import { prisma } from '@/lib/prisma';

export async function getDuplicateCustomers() {
  const customers = await prisma.customer.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });

  const grouped = new Map<string, typeof customers>();

  for (const customer of customers) {
    const key = [
      customer.firstName.trim().toLowerCase(),
      customer.lastName.trim().toLowerCase(),
      (customer.phone ?? '').trim(),
      (customer.email ?? '').trim().toLowerCase(),
    ].join('|');

    const arr = grouped.get(key) ?? [];
    arr.push(customer);
    grouped.set(key, arr);
  }

  return [...grouped.values()].filter((group) => group.length > 1);
}

export async function getUnmatchedReferences() {
  return prisma.watchReference.findMany({
    where: { modelId: null },
    include: { brand: true },
    take: 200,
    orderBy: [{ brand: { name: 'asc' } }, { referenceNumber: 'asc' }],
  });
}

export async function getReferencesWithoutModel() {
  return prisma.watchReference.findMany({
    where: { modelId: null },
    include: { brand: true },
    take: 200,
    orderBy: [{ brand: { name: 'asc' } }, { referenceNumber: 'asc' }],
  });
}

export async function getInventoryMissingCatalogMapping() {
  return prisma.stockItem.findMany({
    where: { OR: [{ watchReferenceId: null }] },
    include: { brand: true, model: true, watchReference: true },
    take: 200,
    orderBy: { createdAt: 'desc' },
  });
}
