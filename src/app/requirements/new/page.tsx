import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { createRequirementAction } from "@/actions/requirements";
import RequirementForm from "@/components/requirements/requirement-form";

export default async function NewRequirementPage() {
  const session = await requireAuth();

  const [customers, brands, models, references] = await Promise.all([
    prisma.customer.findMany({
      where: session.role === "SALES_EXECUTIVE" ? { isActive: true, salesExecutiveId: session.id } : { isActive: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.model.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, brandId: true } }),
    prisma.watchReference.findMany({
      where: { isActive: true },
      orderBy: { referenceNumber: "asc" },
      take: 1000,
      select: { id: true, referenceNumber: true, brandId: true, modelId: true },
    }),
  ]);

  return (
    <DashboardShell user={session} title="New Requirement">
      <div className="card">
        <RequirementForm
          customers={customers}
          brands={brands}
          models={models}
          references={references}
          action={createRequirementAction}
        />
      </div>
    </DashboardShell>
  );
}
