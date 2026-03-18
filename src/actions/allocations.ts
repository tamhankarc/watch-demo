'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  cancelAllocation,
  createAllocation,
  markAllocationSold,
  runAllocationExpirySweep,
} from '@/lib/services/allocation-service';

export async function createAllocationAction(formData: FormData) {
  const session = await requireAuth();

  const requirementId = Number(formData.get('requirementId'));
  const stockItemId = Number(formData.get('stockItemId'));
  const expiresDate = String(formData.get('expiresDate') || '');
  const expiresTime = String(formData.get('expiresTime') || '');

  if (!expiresDate || !expiresTime) {
    throw new Error('Expiry date and time are required.');
  }

  const expiresAt = new Date(`${expiresDate}T${expiresTime}`);

  await createAllocation(requirementId, stockItemId, expiresAt, {
    id: session.id,
    role: session.role,
  });

  revalidatePath('/allocations');
  revalidatePath('/requirements');
  revalidatePath('/inventory');
  redirect('/allocations');
}

export async function markAllocationSoldAction(id: number) {
  const session = await requireAuth();

  await markAllocationSold(id, {
    id: session.id,
    role: session.role,
  });

  revalidatePath('/allocations');
  revalidatePath('/requirements');
  revalidatePath('/inventory');
}

export async function cancelAllocationAction(id: number) {
  const session = await requireAuth();

  await cancelAllocation(id, {
    id: session.id,
    role: session.role,
  });

  revalidatePath('/allocations');
  revalidatePath('/requirements');
  revalidatePath('/inventory');
}

export async function runAllocationExpirySweepAction() {
  const session = await requireAuth();

  await runAllocationExpirySweep({
    id: session.id,
    role: session.role,
  });

  revalidatePath('/allocations');
  revalidatePath('/requirements');
  revalidatePath('/inventory');
  revalidatePath('/reports');
}
