import { PrismaClient, RoleCode } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  const [admin, manager, sales] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@polachecks.local' },
      update: {},
      create: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@polachecks.local',
        passwordHash,
        role: RoleCode.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@polachecks.local' },
      update: {},
      create: {
        firstName: 'Manager',
        lastName: 'User',
        email: 'manager@polachecks.local',
        passwordHash,
        role: RoleCode.MANAGER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'sales@polachecks.local' },
      update: {},
      create: {
        firstName: 'Sales',
        lastName: 'Executive',
        email: 'sales@polachecks.local',
        passwordHash,
        role: RoleCode.SALES_EXECUTIVE,
      },
    }),
  ]);

  const rolex = await prisma.brand.upsert({
    where: { slug: 'rolex' },
    update: {},
    create: { name: 'Rolex', slug: 'rolex' },
  });

  const patek = await prisma.brand.upsert({
    where: { slug: 'patek-philippe' },
    update: {},
    create: { name: 'Patek Philippe', slug: 'patek-philippe' },
  });

  const submariner = await prisma.model.upsert({
    where: { brandId_slug: { brandId: rolex.id, slug: 'submariner' } },
    update: {},
    create: { brandId: rolex.id, name: 'Submariner', slug: 'submariner' },
  });

  const nautilus = await prisma.model.upsert({
    where: { brandId_slug: { brandId: patek.id, slug: 'nautilus' } },
    update: {},
    create: { brandId: patek.id, name: 'Nautilus', slug: 'nautilus' },
  });

  const ref1 = await prisma.watchReference.upsert({
    where: { modelId_referenceNumber: { modelId: submariner.id, referenceNumber: '126610LN' } },
    update: {},
    create: {
      brandId: rolex.id,
      modelId: submariner.id,
      referenceNumber: '126610LN',
      displayName: 'Rolex Submariner Date 126610LN',
      description: 'Seed catalog reference for demo use',
      caseMaterial: 'Oystersteel',
      dialColor: 'Black',
      braceletMaterial: 'Oystersteel',
      currencyCode: 'USD',
    },
  });

  const ref2 = await prisma.watchReference.upsert({
    where: { modelId_referenceNumber: { modelId: nautilus.id, referenceNumber: '5711/1A-010' } },
    update: {},
    create: {
      brandId: patek.id,
      modelId: nautilus.id,
      referenceNumber: '5711/1A-010',
      displayName: 'Patek Philippe Nautilus 5711/1A-010',
      description: 'Seed catalog reference for demo use',
      caseMaterial: 'Steel',
      dialColor: 'Blue',
      braceletMaterial: 'Steel',
      currencyCode: 'USD',
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Collector',
      email: 'john.collector@example.com',
      city: 'Los Angeles',
      country: 'USA',
      salesExecutiveId: sales.id,
      customerTier: 'Premium',
    },
  });

  await prisma.requirement.upsert({
    where: { id: 1 },
    update: {},
    create: {
      customerId: customer.id,
      salesExecutiveId: sales.id,
      brandId: rolex.id,
      modelId: submariner.id,
      watchReferenceId: ref1.id,
      notes: 'Customer interested in black dial sports model.',
    },
  });

  await prisma.stockItem.upsert({
    where: { serialNumber: 'SER-ROLEX-0001' },
    update: {},
    create: {
      brandId: rolex.id,
      modelId: submariner.id,
      watchReferenceId: ref1.id,
      serialNumber: 'SER-ROLEX-0001',
      storeSku: 'POL-ROLEX-126610LN-1',
      currentStatus: 'AVAILABLE',
    },
  });

  await prisma.stockItem.upsert({
    where: { serialNumber: 'SER-PATEK-0001' },
    update: {},
    create: {
      brandId: patek.id,
      modelId: nautilus.id,
      watchReferenceId: ref2.id,
      serialNumber: 'SER-PATEK-0001',
      storeSku: 'POL-PATEK-5711-1',
      currentStatus: 'AVAILABLE',
    },
  });

  console.log({ admin: admin.email, manager: manager.email, sales: sales.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
