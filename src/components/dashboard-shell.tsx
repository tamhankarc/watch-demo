import Link from 'next/link';
import { ReactNode } from 'react';
import { SessionUser } from '@/lib/auth';
import { logoutAction } from '@/lib/actions';

export function DashboardShell({ user, title, children }: { user: SessionUser; title: string; children: ReactNode }) {
  const isAdmin = user.role === 'ADMIN';
  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER';
  const canUploadStock = canManage;
  const canAllocate = canManage;
  const canSeeReports = user.role === 'ADMIN' || user.role === 'MANAGER';

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="muted">Polacheck’s Jewelers</div>
          <h1 style={{ margin: '6px 0 0' }}>{title}</h1>
        </div>
        <form action={logoutAction}>
          <button className="button secondary" type="submit">Logout</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <strong>{user.firstName} {user.lastName}</strong> <span className="badge">{user.role}</span>
      </div>

      <nav className="nav">
        <Link href="/dashboard">Dashboard</Link>
        {(user.role === 'ADMIN' || user.role === 'MANAGER') ? (
          <Link href="/users" className="nav-link">
            Users
          </Link>
        ) : null}
        <Link href="/customers">Customers</Link>
        <Link href="/requirements">Requirements</Link>
        <Link href="/inventory">Inventory</Link>
        {canAllocate ? <Link href="/allocations">Allocations</Link> : null}
        <Link href="/catalog/brands">Brands</Link>
        <Link href="/catalog/models">Models</Link>
        <Link href="/catalog/references">References</Link>
        {canSeeReports ? <Link href="/reports">Reports</Link> : null}
        {canUploadStock ? <Link href="/inventory/upload">Stock Upload</Link> : null}
        {isAdmin ? <Link href="/admin/catalog-sync">Catalog Sync</Link> : null}
      </nav>

      {children}
    </div>
  );
}
