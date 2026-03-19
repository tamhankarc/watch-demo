import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import CustomerForm from "@/components/customers/customer-form";
import { createCustomerAction } from "@/actions/customers";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function NewCustomerPage() {
  const session = await requireAuth();

  const salesExecutives = await prisma.user.findMany({
    where: { role: "SALES_EXECUTIVE", isActive: true },
    orderBy: [{ firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });

  return (
    <DashboardShell user={session} title="New Customer">
      <div className="max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold">New Customer</h1>

        <CustomerForm
          salesExecutives={salesExecutives}
          action={createCustomerAction}
        />
      </div>
    </DashboardShell>
  );
}