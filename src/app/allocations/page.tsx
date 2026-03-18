import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AllocationRowActions from '@/components/allocations/allocation-row-actions';
import AllocationSweepButton from '@/components/allocations/allocation-sweep-button';

type SearchParams = Promise<{ status?: string; q?: string }>;

type AllocationWithRelations = Prisma.AllocationGetPayload<{
  include: {
    customer: true;
    requirement: {
      include: {
        brand: true;
        model: true;
        watchReference: true;
      };
    };
    stockItem: {
      include: {
        brand: true;
        model: true;
        watchReference: true;
      };
    };
  };
}>;

export default async function AllocationsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireAuth();
  const params = await searchParams;
  const canManage = session.role === 'ADMIN' || session.role === 'MANAGER';

  const where: any = {};
  if (params.status) where.status = params.status;
  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { customer: { firstName: { contains: q, mode: 'insensitive' } } },
      { customer: { lastName: { contains: q, mode: 'insensitive' } } },
      { stockItem: { serialNumber: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const allocations: AllocationWithRelations[] = await prisma.allocation.findMany({
    where,
    include: {
      customer: true,
      requirement: {
        include: {
          brand: true,
          model: true,
          watchReference: true,
        },
      },
      stockItem: {
        include: {
          brand: true,
          model: true,
          watchReference: true,
        },
      },
    },
    orderBy: [{ assignedAt: 'desc' }],
  });

  return (
    <DashboardShell user={session} title="Allocations">
      <div className="card" style={{ marginBottom: 16 }}>
        <form method="get" className="form">
          <div className="grid grid-3">
            <input className="input" name="q" defaultValue={params.q ?? ''} placeholder="Search customer / serial" />
            <select className="select" name="status" defaultValue={params.status ?? ''}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SOLD">Sold</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="button" type="submit">Apply Filters</button>
            <Link href="/allocations" className="button secondary">Reset</Link>
            {canManage ? <Link href="/allocations/new" className="button secondary">New Allocation</Link> : null}
          </div>
        </form>

        {canManage ? (
          <div style={{ marginTop: 12 }}>
            <AllocationSweepButton />
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {allocations.map((a) => (
          <div key={a.id} className="card">
            <div style={{ fontWeight: 600 }}>#{a.id} • {a.customer.firstName} {a.customer.lastName}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              {a.requirement.brand.name}
              {a.requirement.model ? ` • ${a.requirement.model.name}` : ''}
              {a.requirement.watchReference ? ` • ${a.requirement.watchReference.referenceNumber}` : ''}
            </div>
            <div className="muted">Stock: {a.stockItem.serialNumber} • {a.stockItem.currentStatus}</div>
            <div className="muted">Expires: {a.expiresAt.toISOString().slice(0, 16).replace('T', ' ')}</div>
            <div className="muted">Status: {a.status}</div>

            {canManage ? (
              <AllocationRowActions allocationId={a.id} status={a.status} />
            ) : null}
          </div>
        ))}
        {!allocations.length ? <div className="card muted">No allocations found.</div> : null}
      </div>
    </DashboardShell>
  );
}
