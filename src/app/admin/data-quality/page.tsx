import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';
import {
  getDuplicateCustomers,
  getInventoryMissingCatalogMapping,
  getReferencesWithoutModel,
  getUnmatchedReferences,
} from '@/lib/services/data-quality-service';

export default async function DataQualityPage() {
  const session = await requireRole(['ADMIN', 'MANAGER']);

  const [duplicates, unmatchedRefs, refsWithoutModel, inventoryIssues] = await Promise.all([
    getDuplicateCustomers(),
    getUnmatchedReferences(),
    getReferencesWithoutModel(),
    getInventoryMissingCatalogMapping(),
  ]);

  return (
    <DashboardShell user={session} title="Data Quality Tools">
      <div className="space-y-4">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Duplicate Customers</h3>
          {duplicates.length ? (
            <ul style={{ paddingLeft: 18 }}>
              {duplicates.map((group, index) => (
                <li key={index}>{group.map((c) => `${c.firstName} ${c.lastName} (#${c.id})`).join(' | ')}</li>
              ))}
            </ul>
          ) : <div className="muted">No duplicate groups found.</div>}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>References Without Model</h3>
          <ul style={{ paddingLeft: 18 }}>
            {refsWithoutModel.map((ref) => <li key={ref.id}>{ref.brand.name} • {ref.referenceNumber}</li>)}
          </ul>
          {!refsWithoutModel.length ? <div className="muted">No references without model.</div> : null}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Unmatched References</h3>
          <ul style={{ paddingLeft: 18 }}>
            {unmatchedRefs.map((ref) => <li key={ref.id}>{ref.brand.name} • {ref.referenceNumber}</li>)}
          </ul>
          {!unmatchedRefs.length ? <div className="muted">No unmatched references.</div> : null}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Inventory Missing Catalog Mapping</h3>
          <ul style={{ paddingLeft: 18 }}>
            {inventoryIssues.map((item) => <li key={item.id}>{item.brand.name} • {item.model.name} • {item.serialNumber} • ref: {item.watchReference?.referenceNumber ?? 'missing'}</li>)}
          </ul>
          {!inventoryIssues.length ? <div className="muted">No inventory mapping issues.</div> : null}
        </div>
      </div>
    </DashboardShell>
  );
}
