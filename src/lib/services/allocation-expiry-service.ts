import { prisma } from '@/lib/prisma';

export async function expireOverdueAllocations(now = new Date()) {
  const overdue = await prisma.allocation.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: now },
    },
    orderBy: { expiresAt: 'asc' },
  });

  let expired = 0;

  for (const allocation of overdue) {
    await prisma.$transaction(async (tx) => {
      await tx.allocation.update({ where: { id: allocation.id }, data: { status: 'CANCELLED', remarks: allocation.remarks ?? 'Expired by automation' } });
      await tx.requirement.update({ where: { id: allocation.requirementId }, data: { status: 'WAITING' } });
      await tx.stockItem.update({ where: { id: allocation.stockItemId }, data: { currentStatus: 'AVAILABLE' } });
    });
    expired += 1;
  }

  return { expired };
}
