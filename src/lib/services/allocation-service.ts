import { RoleCode } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type CurrentUser = { id: number; role: RoleCode };

function ensurePrivileged(user: CurrentUser) {
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    throw new Error('Only Manager/Admin can manage allocations.');
  }
}

export async function getAllocationCandidates() {
  const [requirements, stockItems] = await Promise.all([
    prisma.requirement.findMany({
      where: { status: 'WAITING' },
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        brandId: true,
        modelId: true,
        watchReferenceId: true,
        customer: { select: { firstName: true, lastName: true } },
        brand: { select: { name: true } },
        model: { select: { name: true } },
        watchReference: { select: { referenceNumber: true } },
      },
    }),
    prisma.stockItem.findMany({
      where: { currentStatus: 'AVAILABLE', isActive: true },
      orderBy: [{ dateReceived: 'desc' }],
      select: {
        id: true,
        brandId: true,
        modelId: true,
        watchReferenceId: true,
        serialNumber: true,
        currentStatus: true,
        brand: { select: { name: true } },
        model: { select: { name: true } },
        watchReference: { select: { referenceNumber: true } },
      },
    }),
  ]);

  return { requirements, stockItems };
}

export async function createAllocation(
  requirementId: number,
  stockItemId: number,
  expiresAt: Date,
  currentUser: CurrentUser
) {
  ensurePrivileged(currentUser);

  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    include: { customer: true },
  });

  const stockItem = await prisma.stockItem.findUnique({
    where: { id: stockItemId },
  });

  if (!requirement) throw new Error('Requirement not found.');
  if (!stockItem) throw new Error('Stock item not found.');
  if (requirement.status !== 'WAITING') throw new Error('Requirement is not in WAITING state.');
  if (stockItem.currentStatus !== 'AVAILABLE') throw new Error('Stock item is not available.');
  if (expiresAt <= new Date()) throw new Error('Expiry must be in the future.');

  if (stockItem.brandId !== requirement.brandId) {
    throw new Error('Stock item brand does not match requirement brand.');
  }

  if (requirement.modelId && stockItem.modelId !== requirement.modelId) {
    throw new Error('Stock item model does not match requirement model.');
  }

  if (requirement.watchReferenceId && stockItem.watchReferenceId !== requirement.watchReferenceId) {
    throw new Error('Stock item reference does not match requirement reference.');
  }

  return prisma.$transaction(async (tx) => {
    const allocation = await tx.allocation.create({
      data: {
        requirementId,
        customerId: requirement.customerId,
        stockItemId,
        assignedByUserId: currentUser.id,
        assignedAt: new Date(),
        expiresAt,
        status: 'ACTIVE',
      },
    });

    await tx.requirement.update({
      where: { id: requirementId },
      data: { status: 'ASSIGNED' },
    });

    await tx.stockItem.update({
      where: { id: stockItemId },
      data: { currentStatus: 'ASSIGNED' },
    });

    return allocation;
  });
}

export async function markAllocationSold(id: number, currentUser: CurrentUser) {
  ensurePrivileged(currentUser);

  const allocation = await prisma.allocation.findUnique({
    where: { id },
  });

  if (!allocation) throw new Error('Allocation not found.');
  if (allocation.status !== 'ACTIVE') throw new Error('Allocation is not active.');

  return prisma.$transaction(async (tx) => {
    await tx.allocation.update({
      where: { id },
      data: { status: 'SOLD' },
    });

    await tx.requirement.update({
      where: { id: allocation.requirementId },
      data: { status: 'SOLD' },
    });

    await tx.stockItem.update({
      where: { id: allocation.stockItemId },
      data: { currentStatus: 'SOLD' },
    });
  });
}

export async function cancelAllocation(id: number, currentUser: CurrentUser) {
  ensurePrivileged(currentUser);

  const allocation = await prisma.allocation.findUnique({
    where: { id },
  });

  if (!allocation) throw new Error('Allocation not found.');
  if (allocation.status !== 'ACTIVE') throw new Error('Only active allocations can be cancelled.');

  return prisma.$transaction(async (tx) => {
    await tx.allocation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await tx.requirement.update({
      where: { id: allocation.requirementId },
      data: { status: 'WAITING' },
    });

    await tx.stockItem.update({
      where: { id: allocation.stockItemId },
      data: { currentStatus: 'AVAILABLE' },
    });
  });
}

export async function runAllocationExpirySweep(currentUser: CurrentUser) {
  ensurePrivileged(currentUser);

  const now = new Date();
  const expired = await prisma.allocation.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: now },
    },
    select: {
      id: true,
      requirementId: true,
      stockItemId: true,
    },
  });

  for (const allocation of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.allocation.update({
        where: { id: allocation.id },
        data: { status: 'EXPIRED' as any },
      });

      await tx.requirement.update({
        where: { id: allocation.requirementId },
        data: { status: 'WAITING' },
      });

      await tx.stockItem.update({
        where: { id: allocation.stockItemId },
        data: { currentStatus: 'AVAILABLE' },
      });
    });
  }

  return { swept: expired.length };
}
