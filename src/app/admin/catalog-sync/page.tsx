import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function CatalogSyncPage() {
  const session = await requireRole(['ADMIN']);
  const runs = await prisma.catalogSyncRun.findMany({ orderBy: { startedAt: 'desc' }, take: 20 });

  return (
    <DashboardShell user={session} title="Catalog Sync">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>thewatchapi sync history</h3>
        <p className="muted">Use <code>npm run catalog:sync</code> or POST <code>/api/catalog/sync</code> after setting your API key.</p>
        <table className="table">
          <thead>
            <tr>
              <th>Started</th>
              <th>Run Type</th>
              <th>Status</th>
              <th>Ended</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>{run.startedAt.toISOString()}</td>
                <td>{run.runType}</td>
                <td>{run.status}</td>
                <td>{run.endedAt ? run.endedAt.toISOString() : '—'}</td>
              </tr>
            ))}
            {!runs.length ? <tr><td colSpan={4} className="muted">No sync runs yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
