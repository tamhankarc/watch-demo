import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ReportsPage() {
  const session = await requireRole(['ADMIN', 'MANAGER']);

  const [
    customerCount,
    activeCustomerCount,
    requirementCount,
    waitingRequirements,
    assignedRequirements,
    soldRequirements,
    stockCount,
    availableStock,
    activeAllocations,
    soldAllocations,
    recentAllocations,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.requirement.count(),
    prisma.requirement.count({ where: { status: 'WAITING' } }),
    prisma.requirement.count({ where: { status: 'ASSIGNED' } }),
    prisma.requirement.count({ where: { status: 'SOLD' } }),
    prisma.stockItem.count(),
    prisma.stockItem.count({ where: { currentStatus: 'AVAILABLE' } }),
    prisma.allocation.count({ where: { status: 'ACTIVE' } }),
    prisma.allocation.count({ where: { status: 'SOLD' } }),
    prisma.allocation.findMany({
      include: {
        customer: true,
        requirement: { include: { brand: true, model: true, watchReference: true } },
        stockItem: { include: { watchReference: true } },
      },
      orderBy: { assignedAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <DashboardShell user={session} title="Reports">
      <div className="grid grid-4">
        <div className="card"><div className="muted">Customers</div><div className="kpi">{customerCount}</div></div>
        <div className="card"><div className="muted">Active Customers</div><div className="kpi">{activeCustomerCount}</div></div>
        <div className="card"><div className="muted">Requirements</div><div className="kpi">{requirementCount}</div></div>
        <div className="card"><div className="muted">Stock Items</div><div className="kpi">{stockCount}</div></div>
      </div>

      <div className="grid grid-4" style={{ marginTop: 16 }}>
        <div className="card"><div className="muted">Waiting Requirements</div><div className="kpi">{waitingRequirements}</div></div>
        <div className="card"><div className="muted">Assigned Requirements</div><div className="kpi">{assignedRequirements}</div></div>
        <div className="card"><div className="muted">Sold Requirements</div><div className="kpi">{soldRequirements}</div></div>
        <div className="card"><div className="muted">Available Stock</div><div className="kpi">{availableStock}</div></div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card"><div className="muted">Active Allocations</div><div className="kpi">{activeAllocations}</div></div>
        <div className="card"><div className="muted">Sold Allocations</div><div className="kpi">{soldAllocations}</div></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Recent Allocations</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Requirement</th>
              <th>Stock Serial</th>
              <th>Status</th>
              <th>Assigned</th>
            </tr>
          </thead>
          <tbody>
            {recentAllocations.map((row) => (
              <tr key={row.id}>
                <td>{row.customer.firstName} {row.customer.lastName}</td>
                <td>
                  {row.requirement.brand.name}
                  {row.requirement.model ? `  ${row.requirement.model.name}` : ''}
                  {row.requirement.watchReference ? `  ${row.requirement.watchReference.referenceNumber}` : ''}
                </td>
                <td>{row.stockItem.serialNumber}</td>
                <td>{row.status}</td>
                <td>{row.assignedAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
            {!recentAllocations.length ? <tr><td colSpan={5} className="muted">No allocations found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
