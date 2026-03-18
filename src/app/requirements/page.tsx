import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import { getRequirementsForUser } from '@/lib/services/requirement-service';
import { prisma } from '@/lib/prisma';

type SearchParams = Promise<{ status?: string; brandId?: string; q?: string; salesExecutiveId?: string }>;

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireAuth();
  const params = await searchParams;

  const filters = {
    status: params.status as any,
    brandId: params.brandId ? Number(params.brandId) : undefined,
    salesExecutiveId:
      session.role === 'SALES_EXECUTIVE'
        ? undefined
        : params.salesExecutiveId
        ? Number(params.salesExecutiveId)
        : undefined,
    customerSearch: params.q?.trim() || undefined,
  };

  const [requirements, brands, salesExecutives] = await Promise.all([
    getRequirementsForUser({ id: session.id, role: session.role }, filters),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: 'SALES_EXECUTIVE', isActive: true },
      orderBy: [{ firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  return (
    <DashboardShell user={session} title="Requirements">
      <div className="card" style={{ marginBottom: 16 }}>
        <form method="get" className="form">
          <div className="grid grid-3">
            <input className="input" name="q" defaultValue={params.q ?? ''} placeholder="Search customer" />
            <select className="select" name="status" defaultValue={params.status ?? ''}>
              <option value="">All statuses</option>
              <option value="WAITING">Waiting</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="SOLD">Sold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select className="select" name="brandId" defaultValue={params.brandId ?? ''}>
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>

          {session.role !== 'SALES_EXECUTIVE' ? (
            <div style={{ marginTop: 12 }}>
              <select className="select" name="salesExecutiveId" defaultValue={params.salesExecutiveId ?? ''}>
                <option value="">All sales executives</option>
                {salesExecutives.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="button" type="submit">Apply Filters</button>
            <Link href="/requirements" className="button secondary">Reset</Link>
            <Link href="/requirements/new" className="button secondary">New Requirement</Link>
          </div>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Sales Executive</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Reference</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => (
              <tr key={req.id}>
                <td>{req.customer.firstName} {req.customer.lastName}</td>
                <td>{req.salesExecutive.firstName} {req.salesExecutive.lastName}</td>
                <td>{req.brand.name}</td>
                <td>{req.model?.name ?? '—'}</td>
                <td>{req.watchReference?.referenceNumber ?? '—'}</td>
                <td>{req.priorityRank ?? '—'}</td>
                <td>{req.status}</td>
                <td>{new Date(req.updatedAt).toLocaleDateString()}</td>
                <td><Link href={`/requirements/${req.id}`}>View</Link></td>
              </tr>
            ))}
            {!requirements.length ? (
              <tr>
                <td colSpan={9} className="muted">No requirements found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
