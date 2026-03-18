'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { updateReferenceMetadata } from '@/lib/services/catalog-reference-service';

function toNullableString(value: FormDataEntryValue | null) {
  if (value === null) return null;
  const str = String(value).trim();
  return str === '' ? null : str;
}

export async function updateReferenceMetadataAction(id: number, formData: FormData) {
  const session = await requireAuth();

  await updateReferenceMetadata(
    id,
    {
      displayName: toNullableString(formData.get('displayName')),
      imageUrl: toNullableString(formData.get('imageUrl')),
      description: toNullableString(formData.get('description')),
    },
    { id: session.id, role: session.role }
  );

  revalidatePath('/catalog/references');
  revalidatePath(`/catalog/references/${id}`);
  redirect('/catalog/references');
}
