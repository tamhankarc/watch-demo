import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect('/dashboard');

  return (
    <main className="container hero">
      <div className="card">
        <div className="muted">Polacheck’s Jewelers</div>
        <h1>Internal Sales Allocation System</h1>
        <p>
          Phase 1 starter for a MySQL-first Next.js application with login, role-aware dashboard,
          customer management, and catalog browsing.
        </p>
        <Link href="/login" className="button" style={{ display: 'inline-block', marginTop: 16 }}>
          Go to Login
        </Link>
      </div>
    </main>
  );
}
