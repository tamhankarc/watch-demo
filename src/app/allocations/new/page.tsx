import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';
import { getAllocationCandidates } from '@/lib/services/allocation-service';
import { createAllocationAction } from '@/actions/allocations';
import AllocationForm from '@/components/allocations/allocation-form';

export default async function NewAllocationPage() {
  const session = await requireRole(['ADMIN', 'MANAGER']);
  const { requirements, stockItems } = await getAllocationCandidates();

  return (
    <DashboardShell user={session} title="New Allocation">
      <div className="card">
        <AllocationForm requirements={requirements} stockItems={stockItems} action={createAllocationAction} />
      </div>
    </DashboardShell>
  );
}
