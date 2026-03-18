import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BrandForm } from './brand-form';
import { RoleCode } from '@prisma/client';

export default async function BrandsPage() {
  const session = await requireAuth();
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { models: true } } },
    orderBy: { name: 'asc' },
  });

  const canManage = [RoleCode.ADMIN, RoleCode.MANAGER].includes(session.role);

  return (
    <DashboardShell user={session} title="Brands">
      <div className="grid grid-2">
        {canManage ? (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Add Brand</h3>
            <BrandForm />
          </div>
        ) : null}

        <div className="card" style={{ gridColumn: canManage ? 'span 1' : '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Brand Catalog</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Models</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td>{brand.name}</td>
                  <td>{brand._count.models}</td>
                  <td>{brand.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
