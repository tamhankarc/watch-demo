'use server';

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/services/audit-service';

function toNullableString(value: FormDataEntryValue | null) {
  if (value === null) return null;
  const str = String(value).trim();
  return str === '' ? null : str;
}

export async function updateReferenceMediaAction(id: number, formData: FormData) {
  const session = await requireRole(['ADMIN', 'MANAGER']);

  const imageUrl = toNullableString(formData.get('imageUrl'));
  const file = formData.get('imageFile') as File | null;

  let finalImageUrl = imageUrl;

  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'references');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, safeName), bytes);
    finalImageUrl = `/uploads/references/${safeName}`;
  }

  const updated = await prisma.watchReference.update({
    where: { id },
    data: { imageUrl: finalImageUrl, lastSyncedAt: new Date() },
  });

  await logAuditEvent({
    entityType: 'WATCH_REFERENCE',
    entityId: updated.id,
    action: 'REFERENCE_MEDIA_UPDATED',
    actorUserId: session.id,
    summary: `Updated media for reference ${updated.referenceNumber}`,
    metadata: { imageUrl: finalImageUrl },
  });

  revalidatePath('/catalog/references');
  revalidatePath(`/catalog/references/${id}`);
  revalidatePath(`/catalog/references/${id}/media`);
  
  redirect(`/catalog/references/${id}`);
}
