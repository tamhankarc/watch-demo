import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import { getUnreadNotifications } from '@/lib/services/notification-service';

export default async function NotificationsPage() {
  const session = await requireAuth();
  const notifications = await getUnreadNotifications(100);

  return (
    <DashboardShell user={session} title="Notifications">
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Title</th>
              <th>Message</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id}>
                <td>{n.type}</td>
                <td>{n.title}</td>
                <td>{n.message}</td>
                <td>{new Date(n.createdAt).toLocaleString()}</td>
                <td>{n.link ? <Link href={n.link}>Open</Link> : '—'}</td>
              </tr>
            ))}
            {!notifications.length ? <tr><td colSpan={5} className="muted">No notifications.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
