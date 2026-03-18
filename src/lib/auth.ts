import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { RoleCode } from '@prisma/client';

const COOKIE_NAME = 'polachecks_session';

export type SessionUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleCode;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function verifyPassword(raw: string, hash: string) {
  return bcrypt.compare(raw, hash);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  const payload: SessionUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return payload;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, getJwtSecret());
    return verified.payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function requireRole(roles: RoleCode[]) {
  const session = await requireAuth();
  if (!roles.includes(session.role)) redirect('/dashboard');
  return session;
}
