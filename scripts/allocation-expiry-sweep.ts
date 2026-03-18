import { prisma } from '@/lib/prisma';

async function main() {
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

  console.log(`Found ${expired.length} expired allocations`);

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

  console.log('Expiry sweep complete');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
