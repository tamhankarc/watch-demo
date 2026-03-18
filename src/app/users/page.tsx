import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import { getManagedUsers } from '@/lib/services/user-service';
import UserActiveToggle from '@/components/users/user-active-toggle';

export default async function UsersPage() {
  const session = await requireAuth();

  if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
    throw new Error('You are not allowed to access this page.');
  }

  const users = await getManagedUsers({
    id: session.id,
    role: session.role,
  });

  return (
    <DashboardShell user={session} title="Users">
      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Internal Users</h3>
          <div className="muted">
            {session.role === 'ADMIN'
              ? 'Manage Managers and Sales Executives'
              : 'Manage Sales Executives'}
          </div>
        </div>

        <Link href="/users/new" className="button secondary">
          New User
        </Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th>Updated</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.isActive ? 'Yes' : 'No'}</td>
                <td>{new Date(user.updatedAt).toLocaleDateString()}</td>
                <td>
                  <Link href={`/users/${user.id}`}>Edit</Link>
                </td>
                <td>
                  <UserActiveToggle userId={user.id} isActive={user.isActive} />
                </td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td colSpan={7} className="muted">No users found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
