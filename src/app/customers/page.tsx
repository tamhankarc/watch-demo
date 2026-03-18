import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type SearchParams = Promise<{ q?: string; salesExecutiveId?: string; active?: string }>;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireAuth();
  const params = await searchParams;

  const where: any = {};

  if (session.role === 'SALES_EXECUTIVE') {
    where.salesExecutiveId = session.id;
  } else if (params.salesExecutiveId) {
    where.salesExecutiveId = Number(params.salesExecutiveId);
  }

  if (params.active === 'active') where.isActive = true;
  if (params.active === 'inactive') where.isActive = false;

  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [salesExecutives, customers] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'SALES_EXECUTIVE', isActive: true },
      orderBy: [{ firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.customer.findMany({
      where,
      include: {
        salesExecutive: true,
        requirements: { select: { id: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
    }),
  ]);

  return (
    <DashboardShell user={session} title="Customers">
      <div className="card" style={{ marginBottom: 16 }}>
        <form method="get" className="form">
          <div className="grid grid-3">
            <input className="input" name="q" defaultValue={params.q ?? ''} placeholder="Search name / email / phone" />
            {session.role !== 'SALES_EXECUTIVE' ? (
              <select className="select" name="salesExecutiveId" defaultValue={params.salesExecutiveId ?? ''}>
                <option value="">All sales executives</option>
                {salesExecutives.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            ) : <div />}
            <select className="select" name="active" defaultValue={params.active ?? ''}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="button" type="submit">Apply Filters</button>
            <Link href="/customers" className="button secondary">Reset</Link>
            {(session.role === 'ADMIN' || session.role === 'MANAGER') ? (
              <Link href="/customers/new" className="button secondary">New Customer</Link>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sales Executive</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Requirements</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.firstName} {c.lastName}</td>
                <td>{c.salesExecutive.firstName} {c.salesExecutive.lastName}</td>
                <td>{c.phone ?? '—'}</td>
                <td>{c.email ?? '—'}</td>
                <td>{c.requirements.length}</td>
                <td>{c.isActive ? 'Active' : 'Inactive'}</td>
                <td><Link href={`/customers/${c.id}`}>View</Link></td>
              </tr>
            ))}
            {!customers.length ? (
              <tr>
                <td colSpan={7} className="muted">No customers found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
