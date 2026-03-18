import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';
import StockUploadForm from '@/components/inventory/stock-upload-form';

export default async function InventoryUploadPage() {
  const session = await requireRole(['ADMIN', 'MANAGER']);

  return (
    <DashboardShell user={session} title="Upload Inventory">
      <div className="card">
        <StockUploadForm />
      </div>
    </DashboardShell>
  );
}
