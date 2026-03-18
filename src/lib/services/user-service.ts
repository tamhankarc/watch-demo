import bcrypt from 'bcryptjs';
import { RoleCode } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type CurrentUser = {
  id: number;
  role: RoleCode;
};

export type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: RoleCode;
  password?: string | null;
  isActive?: boolean;
};

function isAdmin(role: RoleCode) {
  return role === 'ADMIN';
}

function isManager(role: RoleCode) {
  return role === 'MANAGER';
}

function canManageUsers(role: RoleCode) {
  return isAdmin(role) || isManager(role);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function ensureCanCreateRole(currentUser: CurrentUser, targetRole: RoleCode) {
  if (!canManageUsers(currentUser.role)) {
    throw new Error('You are not allowed to manage users.');
  }

  if (isAdmin(currentUser.role)) {
    if (targetRole !== 'MANAGER' && targetRole !== 'SALES_EXECUTIVE') {
      throw new Error('Admin can only create Manager or Sales Executive users.');
    }
    return;
  }

  if (isManager(currentUser.role)) {
    if (targetRole !== 'SALES_EXECUTIVE') {
      throw new Error('Managers can only create Sales Executives.');
    }
  }
}

function ensureCanEditUser(currentUser: CurrentUser, targetUserRole: RoleCode, nextRole?: RoleCode) {
  if (!canManageUsers(currentUser.role)) {
    throw new Error('You are not allowed to manage users.');
  }

  if (isAdmin(currentUser.role)) {
    if (nextRole && nextRole !== 'MANAGER' && nextRole !== 'SALES_EXECUTIVE') {
      throw new Error('Admin can only save Manager or Sales Executive users here.');
    }
    return;
  }

  if (isManager(currentUser.role)) {
    if (targetUserRole !== 'SALES_EXECUTIVE') {
      throw new Error('Managers can only edit Sales Executives.');
    }
    if (nextRole && nextRole !== 'SALES_EXECUTIVE') {
      throw new Error('Managers can only assign the Sales Executive role.');
    }
  }
}

export async function getManagedUsers(currentUser: CurrentUser) {
  if (!canManageUsers(currentUser.role)) {
    throw new Error('You are not allowed to view users.');
  }

  const where =
    currentUser.role === 'ADMIN'
      ? { role: { in: ['MANAGER', 'SALES_EXECUTIVE'] as RoleCode[] } }
      : { role: 'SALES_EXECUTIVE' as RoleCode };

  return prisma.user.findMany({
    where,
    orderBy: [{ updatedAt: 'desc' }],
  });
}

export async function getManagedUserById(id: number, currentUser: CurrentUser) {
  if (!canManageUsers(currentUser.role)) {
    throw new Error('You are not allowed to view users.');
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  ensureCanEditUser(currentUser, user.role);

  return user;
}

export async function createManagedUser(input: UserInput, currentUser: CurrentUser) {
  ensureCanCreateRole(currentUser, input.role);

  const email = normalizeEmail(input.email);

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error('A user with this email already exists.');
  }

  if (!input.password || input.password.trim().length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const passwordHash = await bcrypt.hash(input.password.trim(), 10);

  return prisma.user.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      role: input.role,
      passwordHash,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateManagedUser(id: number, input: UserInput, currentUser: CurrentUser) {
  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('User not found.');
  }

  ensureCanEditUser(currentUser, existing.role, input.role);

  const email = normalizeEmail(input.email);

  const duplicate = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id },
    },
  });

  if (duplicate) {
    throw new Error('Another user with this email already exists.');
  }

  const data: any = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    role: input.role,
    isActive: input.isActive ?? true,
  };

  if (input.password && input.password.trim()) {
    if (input.password.trim().length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    data.passwordHash = await bcrypt.hash(input.password.trim(), 10);
  }

  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function toggleManagedUserActive(id: number, currentUser: CurrentUser) {
  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('User not found.');
  }

  ensureCanEditUser(currentUser, existing.role, existing.role);

  return prisma.user.update({
    where: { id },
    data: {
      isActive: !existing.isActive,
    },
  });
}

export async function resetManagedUserPassword(id: number, password: string, currentUser: CurrentUser) {
  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('User not found.');
  }

  ensureCanEditUser(currentUser, existing.role, existing.role);

  if (!password || password.trim().length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const passwordHash = await bcrypt.hash(password.trim(), 10);

  return prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
}
