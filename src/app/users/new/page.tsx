import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import UserForm from '@/components/users/user-form';
import { createUserAction } from '@/actions/users';

export default async function NewUserPage() {
  const session = await requireAuth();

  if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
    throw new Error('You are not allowed to access this page.');
  }

  return (
    <DashboardShell user={session} title="New User">
      <div className="card">
        <UserForm
          action={createUserAction}
          currentUserRole={session.role}
          mode="create"
        />
      </div>
    </DashboardShell>
  );
}
