import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { parseStockUpload } from '@/lib/excel/stock-upload';
import {
  previewInventoryRows,
  importInventoryPreviewRows,
} from '@/lib/services/inventory-service';

export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'MANAGER']);
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: 'File is required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rows = parseStockUpload(buffer);

    const previewRows = await previewInventoryRows(rows);
    const result = await importInventoryPreviewRows(previewRows, {
      id: session.id,
      role: session.role,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}