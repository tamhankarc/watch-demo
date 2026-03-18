import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import {
  getAdminDashboard,
  getManagerDashboard,
  getSalesExecutiveDashboard,
} from '@/lib/services/dashboard-service';
import { getUnreadNotifications } from '@/lib/services/notification-service';

export default async function DashboardPage() {
  const session = await requireAuth();
  const notifications = await getUnreadNotifications(8);

  return (
    <DashboardShell user={session} title="Dashboard">
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Unread Notifications</h3>
        {notifications.length ? (
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {notifications.map((n) => (
              <li key={n.id} style={{ marginBottom: 8 }}>
                <strong>{n.title}</strong>  {n.message}
                {n.link ? <> <Link href={n.link}>Open</Link></> : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="muted">No unread notifications.</div>
        )}
      </div>

      {session.role === 'SALES_EXECUTIVE' ? <SalesExecutiveDashboard userId={session.id} /> : null}
      {session.role === 'MANAGER' ? <ManagerDashboard /> : null}
      {session.role === 'ADMIN' ? <AdminDashboard /> : null}
    </DashboardShell>
  );
}

async function SalesExecutiveDashboard({ userId }: { userId: number }) {
  const data = await getSalesExecutiveDashboard(userId);
  return (
    <div className="grid grid-3">
      <div className="card"><strong>My Waiting Customers</strong><div>{data.myWaitingCustomers}</div></div>
      <div className="card"><strong>My Assigned Requirements</strong><div>{data.myAssignedRequirements}</div></div>
      <div className="card"><strong>My Sold This Month</strong><div>{data.mySoldThisMonth}</div></div>
    </div>
  );
}

async function ManagerDashboard() {
  const data = await getManagerDashboard();
  return (
    <div className="space-y-4">
      <div className="grid grid-3">
        <div className="card"><strong>Expiring Allocations</strong><div>{data.expiringAllocations}</div></div>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Waiting List by Brand</h3>
        <ul style={{ paddingLeft: 18 }}>
          {data.waitingByBrand.map((row) => <li key={row.brandId}>{row.brandName}: {row.count}</li>)}
        </ul>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Stock Available by Brand</h3>
        <ul style={{ paddingLeft: 18 }}>
          {data.stockAvailableByBrand.map((row) => <li key={row.brandId}>{row.brandName}: {row.count}</li>)}
        </ul>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Sales by Executive</h3>
        <ul style={{ paddingLeft: 18 }}>
          {data.salesByExecutive.map((row) => <li key={row.salesExecutiveId}>{row.salesExecutiveName}: {row.count}</li>)}
        </ul>
      </div>
    </div>
  );
}

async function AdminDashboard() {
  const data = await getAdminDashboard();
  return (
    <div className="space-y-4">
      <div className="grid grid-3">
        <div className="card"><strong>Allocation Conversion Rate</strong><div>{data.allocationConversionRate.rate}% ({data.allocationConversionRate.sold}/{data.allocationConversionRate.total})</div></div>
        <div className="card"><strong>Inventory Upload Health</strong><div>{data.inventoryUploadHealth} stock items</div></div>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Recent User Activity</h3>
        <ul style={{ paddingLeft: 18 }}>
          {data.userActivity.map((u) => <li key={u.id}>{u.firstName} {u.lastName}  {u.role}  {new Date(u.updatedAt).toLocaleString()}</li>)}
        </ul>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Recent Audit Logs</h3>
        <ul style={{ paddingLeft: 18 }}>
          {data.auditLogs.map((log) => <li key={log.id}>{log.action}  {log.summary}  {new Date(log.createdAt).toLocaleString()}</li>)}
        </ul>
      </div>
    </div>
  );
}
