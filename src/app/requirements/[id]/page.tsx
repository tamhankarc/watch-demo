import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  updateRequirementAction,
  changeRequirementStatusAction,
} from "@/actions/requirements";
import RequirementForm from "@/components/requirements/requirement-form";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RequirementDetailPage({ params }: Props) {
  await requireAuth();

  const { id } = await params;
  const requirementId = Number(id);

  if (Number.isNaN(requirementId)) {
    notFound();
  }

  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    include: {
      customer: true,
      brand: true,
      model: true,
      watchReference: true,
    },
  });

  if (!requirement) {
    notFound();
  }

  const [customers, brands, models, references] = await Promise.all([
    prisma.customer.findMany({
      where: { isActive: true },
      orderBy: [{ firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.model.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, brandId: true },
    }),
    prisma.watchReference.findMany({
      where: { isActive: true },
      orderBy: [{ referenceNumber: "asc" }],
      take: 1000,
      select: {
        id: true,
        referenceNumber: true,
        brandId: true,
        modelId: true,
      },
    }),
  ]);

  async function action(formData: FormData) {
    "use server";
    await updateRequirementAction(requirementId, formData);
  }

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Edit Requirement #{requirement.id}
        </h1>

        <p className="text-sm text-gray-500">
          Customer: {requirement.customer.firstName}{" "}
          {requirement.customer.lastName}
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Status</h2>
        <p className="mt-1 text-sm text-gray-500">
          Current status: <span className="font-medium">{requirement.status}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <form
            action={async () => {
              "use server";
              await changeRequirementStatusAction(requirement.id, "WAITING");
            }}
          >
            <button type="submit" className="rounded-md border px-4 py-2 text-sm">
              Mark Waiting
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await changeRequirementStatusAction(requirement.id, "CANCELLED");
            }}
          >
            <button type="submit" className="rounded-md border px-4 py-2 text-sm">
              Mark Cancelled
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await changeRequirementStatusAction(requirement.id, "SOLD");
            }}
          >
            <button type="submit" className="rounded-md border px-4 py-2 text-sm">
              Mark Sold
            </button>
          </form>
        </div>
      </div>

      <RequirementForm
        customers={customers}
        brands={brands}
        models={models}
        references={references}
        action={action}
        defaultValues={{
          customerId: requirement.customerId,
          brandId: requirement.brandId,
          modelId: requirement.modelId,
          watchReferenceId: requirement.watchReferenceId,
          priorityRank: requirement.priorityRank,
          notes: requirement.notes,
        }}
      />
    </div>
  );
}