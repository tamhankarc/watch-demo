import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type SearchParams = Promise<{ q?: string; status?: string; brandId?: string }>;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireAuth();
  const params = await searchParams;

  const where: any = {};
  if (params.status) where.currentStatus = params.status;
  if (params.brandId) where.brandId = Number(params.brandId);
  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { serialNumber: { contains: q, mode: 'insensitive' } },
      { watchReference: { referenceNumber: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [brands, stock] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.stockItem.findMany({
      where,
      include: {
        brand: true,
        model: true,
        watchReference: true,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    }),
  ]);

  return (
    <DashboardShell user={session} title="Inventory">
      <div className="card" style={{ marginBottom: 16 }}>
        <form method="get" className="form">
          <div className="grid grid-3">
            <input className="input" name="q" defaultValue={params.q ?? ''} placeholder="Search serial / reference" />
            <select className="select" name="status" defaultValue={params.status ?? ''}>
              <option value="">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="SOLD">Sold</option>
            </select>
            <select className="select" name="brandId" defaultValue={params.brandId ?? ''}>
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="button" type="submit">Apply Filters</button>
            <Link href="/inventory" className="button secondary">Reset</Link>
            {(session.role === 'ADMIN' || session.role === 'MANAGER') ? (
              <Link href="/inventory/upload" className="button secondary">Upload Stock</Link>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th>Reference</th>
              <th>Serial</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item) => (
              <tr key={item.id}>
                <td>{item.brand.name}</td>
                <td>{item.model.name}</td>
                <td>{item.watchReference?.referenceNumber ?? '—'}</td>
                <td>{item.serialNumber}</td>
                <td>{item.currentStatus}</td>
              </tr>
            ))}
            {!stock.length ? (
              <tr>
                <td colSpan={5} className="muted">No stock found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
