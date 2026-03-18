import { prisma } from '@/lib/prisma';

export async function createExpiringAllocationNotifications() {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const allocations = await prisma.allocation.findMany({
    where: { status: 'ACTIVE', expiresAt: { gte: now, lte: next24h } },
    include: { customer: true },
  });

  let created = 0;
  for (const allocation of allocations) {
    const existing = await prisma.notification.findFirst({
      where: {
        type: 'ALLOCATION_EXPIRING',
        metadata: { path: ['allocationId'], equals: allocation.id },
      } as any,
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        type: 'ALLOCATION_EXPIRING',
        title: 'Allocation expiring soon',
        message: `Allocation #${allocation.id} for ${allocation.customer.firstName} ${allocation.customer.lastName} expires within 24 hours.`,
        link: '/allocations',
        metadata: { allocationId: allocation.id, customerId: allocation.customerId },
      },
    });
    created += 1;
  }
  return { created };
}

export async function createStockMatchNotifications() {
  const waitingRequirements = await prisma.requirement.findMany({
    where: { status: 'WAITING' },
    include: { customer: true },
    take: 300,
  });

  let created = 0;
  for (const req of waitingRequirements) {
    const stockMatches = await prisma.stockItem.findMany({
      where: {
        currentStatus: 'AVAILABLE',
        isActive: true,
        brandId: req.brandId,
        ...(req.modelId ? { modelId: req.modelId } : {}),
        ...(req.watchReferenceId ? { watchReferenceId: req.watchReferenceId } : {}),
      },
      take: 5,
    });

    if (!stockMatches.length) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        type: 'STOCK_MATCH_FOUND',
        metadata: { path: ['requirementId'], equals: req.id },
      } as any,
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        type: 'STOCK_MATCH_FOUND',
        title: 'Matching stock available',
        message: `${stockMatches.length} matching stock item(s) found for requirement #${req.id}.`,
        link: '/allocations/new',
        metadata: { requirementId: req.id, stockItemIds: stockMatches.map(s => s.id) },
      },
    });
    created += 1;
  }
  return { created };
}

export async function createSoldAllocationCompletionReminders() {
  const soldAllocations = await prisma.allocation.findMany({
    where: { status: 'SOLD', updatedAt: { gte: new Date(Date.now() - 3*24*60*60*1000) } },
    include: { customer: true },
    take: 200,
  });

  let created = 0;
  for (const allocation of soldAllocations) {
    const existing = await prisma.notification.findFirst({
      where: {
        type: 'SOLD_ALLOCATION_REMINDER',
        metadata: { path: ['allocationId'], equals: allocation.id },
      } as any,
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        type: 'SOLD_ALLOCATION_REMINDER',
        title: 'Complete sold allocation follow-up',
        message: `Confirm post-sale completion for allocation #${allocation.id} (${allocation.customer.firstName} ${allocation.customer.lastName}).`,
        link: '/allocations',
        metadata: { allocationId: allocation.id },
      },
    });
    created += 1;
  }
  return { created };
}

export async function refreshNotifications() {
  const [expiring, stockMatches, sold] = await Promise.all([
    createExpiringAllocationNotifications(),
    createStockMatchNotifications(),
    createSoldAllocationCompletionReminders(),
  ]);
  return { expiring, stockMatches, sold };
}

export async function getUnreadNotifications(limit = 20) {
  return prisma.notification.findMany({
    where: { status: 'UNREAD' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
