import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ModelForm } from './model-form';
import { RoleCode } from '@prisma/client';

export default async function ModelsPage() {
  const session = await requireAuth();
  const [brands, models] = await Promise.all([
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.model.findMany({ include: { brand: true }, orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }] }),
  ]);

  const canManage = [RoleCode.ADMIN, RoleCode.MANAGER].includes(session.role);

  return (
    <DashboardShell user={session} title="Models">
      <div className="grid grid-2">
        {canManage ? (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Add Model</h3>
            <ModelForm brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))} />
          </div>
        ) : null}

        <div className="card" style={{ gridColumn: canManage ? 'span 1' : '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Model Catalog</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Model</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id}>
                  <td>{model.brand.name}</td>
                  <td>{model.name}</td>
                  <td>{model.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
