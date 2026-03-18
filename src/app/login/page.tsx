import { LoginForm } from './login-form';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect('/dashboard');

  return (
    <main className="container hero">
      <div className="card" style={{ maxWidth: 460, margin: '0 auto' }}>
        <div className="muted">Polacheck’s Jewelers</div>
        <h1 style={{ marginTop: 8 }}>Sign in</h1>
        <p className="muted">
          Demo users are seeded for Admin, Manager, and Sales Executive. All use password
          <strong> ChangeMe123!</strong>
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
