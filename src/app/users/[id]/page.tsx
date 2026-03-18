import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireAuth } from '@/lib/auth';
import UserForm from '@/components/users/user-form';
import UserPasswordResetForm from '@/components/users/user-password-reset-form';
import UserActiveToggle from '@/components/users/user-active-toggle';
import { resetUserPasswordAction, updateUserAction } from '@/actions/users';
import { getManagedUserById } from '@/lib/services/user-service';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({ params }: Props) {
  const session = await requireAuth();

  if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
    throw new Error('You are not allowed to access this page.');
  }

  const { id } = await params;
  const userId = Number(id);

  if (Number.isNaN(userId)) {
    notFound();
  }

  let user;
  try {
    user = await getManagedUserById(userId, {
      id: session.id,
      role: session.role,
    });
  } catch {
    notFound();
  }

  async function action(formData: FormData) {
    'use server';
    await updateUserAction(userId, formData);
  }

  async function resetAction(formData: FormData) {
    'use server';
    await resetUserPasswordAction(userId, formData);
  }

  return (
    <DashboardShell user={session} title={`Edit User • ${user.firstName} ${user.lastName}`}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>{user.firstName} {user.lastName}</h3>
            <div className="muted">{user.email} • {user.role}</div>
          </div>
          <UserActiveToggle userId={user.id} isActive={user.isActive} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <UserForm
          action={action}
          currentUserRole={session.role}
          mode="edit"
          defaultValues={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          }}
        />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Reset Password</h3>
        <UserPasswordResetForm action={resetAction} />
      </div>
    </DashboardShell>
  );
}
