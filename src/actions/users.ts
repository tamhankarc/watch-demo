'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { RoleCode } from '@prisma/client';
import { requireAuth } from '@/lib/auth';
import {
  createManagedUser,
  resetManagedUserPassword,
  toggleManagedUserActive,
  updateManagedUser,
  type CurrentUser,
} from '@/lib/services/user-service';

async function getCurrentUser(): Promise<CurrentUser> {
  const session = await requireAuth();
  return {
    id: session.id,
    role: session.role,
  };
}

function toRoleCode(value: FormDataEntryValue | null): RoleCode {
  const role = String(value || '');
  if (role !== 'MANAGER' && role !== 'SALES_EXECUTIVE') {
    throw new Error('Invalid role selected.');
  }
  return role;
}

export async function createUserAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  await createManagedUser(
    {
      firstName: String(formData.get('firstName') || ''),
      lastName: String(formData.get('lastName') || ''),
      email: String(formData.get('email') || ''),
      role: toRoleCode(formData.get('role')),
      password: String(formData.get('password') || ''),
      isActive: formData.get('isActive') === 'on',
    },
    currentUser
  );

  revalidatePath('/users');
  redirect('/users');
}

export async function updateUserAction(id: number, formData: FormData) {
  const currentUser = await getCurrentUser();

  await updateManagedUser(
    id,
    {
      firstName: String(formData.get('firstName') || ''),
      lastName: String(formData.get('lastName') || ''),
      email: String(formData.get('email') || ''),
      role: toRoleCode(formData.get('role')),
      password: String(formData.get('password') || ''),
      isActive: formData.get('isActive') === 'on',
    },
    currentUser
  );

  revalidatePath('/users');
  redirect('/users');
}

export async function toggleUserActiveAction(id: number) {
  const currentUser = await getCurrentUser();
  await toggleManagedUserActive(id, currentUser);
  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
}

export async function resetUserPasswordAction(id: number, formData: FormData) {
  const currentUser = await getCurrentUser();
  const password = String(formData.get('newPassword') || '');
  await resetManagedUserPassword(id, password, currentUser);
  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
  redirect(`/users/${id}`);
}
