'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { parseStockUpload } from '@/lib/excel/stock-upload';
import {
  importInventoryPreviewRows,
  previewInventoryRows,
} from '@/lib/services/inventory-service';

export async function previewInventoryUploadAction(formData: FormData) {
  const session = await requireAuth();

  if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
    throw new Error('Only Manager/Admin can upload inventory.');
  }

  const file = formData.get('file') as File | null;
  if (!file) throw new Error('File is required.');

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const rows = parseStockUpload(buffer);

  return previewInventoryRows(rows);
}

export async function importInventoryPreviewAction(previewRowsJson: string) {
  const session = await requireAuth();

  const previewRows = JSON.parse(previewRowsJson);
  const result = await importInventoryPreviewRows(previewRows, {
    id: session.id,
    role: session.role,
  });

  revalidatePath('/inventory');
  revalidatePath('/reports');
  return result;
}
