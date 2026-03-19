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
      <div className="container">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 8 }}>New Customer</h1>
          <p className="muted">Create a new customer profile for sales tracking.</p>
        </div>

        <CustomerForm
          salesExecutives={salesExecutives}
          action={createCustomerAction}
        />
      </div>
    </DashboardShell>
  );
}