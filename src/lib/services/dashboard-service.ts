import { prisma } from '@/lib/prisma';

export async function getSalesExecutiveDashboard(userId: number) {
  const [myWaitingCustomers, myAssignedRequirements, mySoldThisMonth, myUnreadNotifications] = await Promise.all([
    prisma.customer.count({
      where: { salesExecutiveId: userId, requirements: { some: { status: 'WAITING' } } },
    }),
    prisma.requirement.count({ where: { salesExecutiveId: userId, status: 'ASSIGNED' } }),
    prisma.requirement.count({
      where: {
        salesExecutiveId: userId,
        status: 'SOLD',
        updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.notification.count({ where: { userId, status: 'UNREAD' } }),
  ]);

  return { myWaitingCustomers, myAssignedRequirements, mySoldThisMonth, myUnreadNotifications };
}

export async function getManagerDashboard() {
  const [waitingByBrand, stockAvailableByBrand, expiringAllocations, salesByExecutive] = await Promise.all([
    prisma.requirement.groupBy({ by: ['brandId'], where: { status: 'WAITING' }, _count: { _all: true } }),
    prisma.stockItem.groupBy({ by: ['brandId'], where: { currentStatus: 'AVAILABLE', isActive: true }, _count: { _all: true } }),
    prisma.allocation.count({ where: { status: 'ACTIVE', expiresAt: { lte: new Date(Date.now()+24*60*60*1000) } } }),
    prisma.requirement.groupBy({ by: ['salesExecutiveId'], where: { status: 'SOLD' }, _count: { _all: true } }),
  ]);

  const [brands, users] = await Promise.all([
    prisma.brand.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ where: { role: 'SALES_EXECUTIVE' }, select: { id: true, firstName: true, lastName: true } }),
  ]);

  const brandNameById = new Map(brands.map(b => [b.id, b.name]));
  const userNameById = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

  return {
    waitingByBrand: waitingByBrand.map(r => ({ brandId: r.brandId, brandName: brandNameById.get(r.brandId) ?? `Brand #${r.brandId}`, count: r._count._all })),
    stockAvailableByBrand: stockAvailableByBrand.map(r => ({ brandId: r.brandId, brandName: brandNameById.get(r.brandId) ?? `Brand #${r.brandId}`, count: r._count._all })),
    expiringAllocations,
    salesByExecutive: salesByExecutive.map(r => ({ salesExecutiveId: r.salesExecutiveId, salesExecutiveName: userNameById.get(r.salesExecutiveId) ?? `User #${r.salesExecutiveId}`, count: r._count._all })),
  };
}

export async function getAdminDashboard() {
  const [userActivity, auditLogs, inventoryUploadHealth, allocationStats] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, firstName: true, lastName: true, role: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 12 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 12 }),
    prisma.stockItem.count({ where: { isActive: true } }),
    Promise.all([prisma.allocation.count(), prisma.allocation.count({ where: { status: 'SOLD' } })]),
  ]);

  const [total, sold] = allocationStats;
  return {
    userActivity,
    auditLogs,
    inventoryUploadHealth,
    allocationConversionRate: { total, sold, rate: total > 0 ? Math.round((sold / total) * 100) : 0 },
  };
}
