import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import CustomerForm from '@/components/customers/customer-form';
import { updateCustomerAction } from '@/actions/customers';
import { getCustomerById } from '@/lib/services/customer-service';

type Props = { params: Promise<{ id: string }> };

export default async function CustomerDetailPage({ params }: Props) {
  const session = await requireAuth();
  const { id } = await params;
  const customerId = Number(id);
  if (Number.isNaN(customerId)) notFound();

  const customer = await getCustomerById(customerId, { id: session.id, role: session.role });
  const salesExecutives = await prisma.user.findMany({
    where: { role: 'SALES_EXECUTIVE', isActive: true },
    orderBy: [{ firstName: 'asc' }],
    select: { id: true, firstName: true, lastName: true },
  });

  async function action(formData: FormData) {
    'use server';
    await updateCustomerAction(customerId, formData);
  }

  return (
    <DashboardShell user={session} title={`${customer.firstName} ${customer.lastName}`}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link href={`/customers/${customer.id}/requirements/new`} className="button secondary">
          Create Requirement
        </Link>
        <Link href="/customers" className="button secondary">
          Back to Customers
        </Link>
      </div>

      {(session.role === 'ADMIN' || session.role === 'MANAGER') ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <CustomerForm
            salesExecutives={salesExecutives}
            action={action}
            defaultValues={{
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              phone: customer.phone,
              city: customer.city,
              state: customer.state,
              country: customer.country,
              remarks: customer.remarks,
              salesExecutiveId: customer.salesExecutiveId,
              isActive: customer.isActive,
            }}
          />
        </div>
      ) : null}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Requirement History</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customer.requirements.map((req) => (
              <tr key={req.id}>
                <td>{req.brand.name}</td>
                <td>{req.model?.name ?? '—'}</td>
                <td>{req.watchReference?.referenceNumber ?? '—'}</td>
                <td>{req.status}</td>
                <td>{new Date(req.updatedAt).toLocaleDateString()}</td>
                <td><Link href={`/requirements/${req.id}`}>Open</Link></td>
              </tr>
            ))}
            {!customer.requirements.length ? (
              <tr>
                <td colSpan={6} className="muted">No requirements yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
