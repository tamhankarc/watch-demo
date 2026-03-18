import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRequirementAction } from '@/actions/requirements';
import RequirementForm from '@/components/requirements/requirement-form';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewCustomerRequirementPage({ params }: Props) {
  const session = await requireAuth();
  const { id } = await params;
  const customerId = Number(id);

  if (Number.isNaN(customerId)) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      salesExecutiveId: true,
      isActive: true,
    },
  });

  if (!customer || !customer.isActive) notFound();

  if (session.role === 'SALES_EXECUTIVE' && customer.salesExecutiveId !== session.id) {
    notFound();
  }

  const [brands, models, references] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.model.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true, brandId: true },
    }),
    prisma.watchReference.findMany({
      where: { isActive: true },
      orderBy: [{ referenceNumber: 'asc' }],
      take: 1000,
      select: {
        id: true,
        referenceNumber: true,
        brandId: true,
        modelId: true,
      },
    }),
  ]);

  return (
    <DashboardShell user={session} title="New Customer Requirement">
      <div className="card">
        <RequirementForm
          customers={[customer]}
          brands={brands}
          models={models}
          references={references}
          action={createRequirementAction}
          defaultValues={{
            customerId: customer.id,
          }}
        />
      </div>
    </DashboardShell>
  );
}
