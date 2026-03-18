import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import CustomerForm from "@/components/customers/customer-form";
import { createCustomerAction } from "@/actions/customers";

export default async function NewCustomerPage() {
  await requireAuth();

  const salesExecutives = await prisma.user.findMany({
    where: { role: "SALES_EXECUTIVE", isActive: true },
    orderBy: [{ firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">New Customer</h1>
      <CustomerForm salesExecutives={salesExecutives} action={createCustomerAction} />
    </div>
  );
}