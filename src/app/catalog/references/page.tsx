import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type SearchParams = Promise<{ q?: string; brandId?: string }>;

export default async function ReferencesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireAuth();
  const params = await searchParams;

  const where: any = {};
  if (params.brandId) where.brandId = Number(params.brandId);
  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { referenceNumber: { contains: q, mode: 'insensitive' } },
      { displayName: { contains: q, mode: 'insensitive' } },
      { model: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [brands, references] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.watchReference.findMany({
      where,
      include: { brand: true, model: true },
      orderBy: [{ brand: { name: 'asc' } }, { model: { name: 'asc' } }, { referenceNumber: 'asc' }],
      take: 100,
    }),
  ]);

  return (
    <DashboardShell user={session} title="Watch References">
      <div className="card" style={{ marginBottom: 16 }}>
        <form method="get" className="form">
          <div className="grid grid-3">
            <input className="input" name="q" defaultValue={params.q ?? ''} placeholder="Search reference / model / display name" />
            <select className="select" name="brandId" defaultValue={params.brandId ?? ''}>
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="button" type="submit">Apply Filters</button>
            <Link href="/catalog/references" className="button secondary">Reset</Link>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Catalog references</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Model</th>
                <th>Reference</th>
                <th>Display Name</th>
                <th>Movement</th>
                <th>Case Material</th>
                <th>Image</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {references.map((ref) => (
                <tr key={ref.id}>
                  <td>{ref.brand.name}</td>
                  <td>{ref.model?.name ?? '—'}</td>
                  <td>{ref.referenceNumber}</td>
                  <td>{ref.displayName}</td>
                  <td>{ref.movement ?? '—'}</td>
                  <td>{ref.caseMaterial ?? '—'}</td>
                  <td>{ref.imageUrl ? 'Yes' : 'No'}</td>
                  <td>
                    {(session.role === 'ADMIN' || session.role === 'MANAGER') ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link href={`/catalog/references/${ref.id}`}>Edit</Link>
                        <Link href={`/catalog/references/${ref.id}/media`}>Media</Link>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}

              {!references.length ? (
                <tr>
                  <td colSpan={8} className="muted">
                    No references found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
