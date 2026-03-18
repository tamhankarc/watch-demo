import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { parseStockWorkbook } from '@/lib/excel/stock-upload';
import { importInventoryRows } from '@/lib/services/inventory-service';

export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'MANAGER']);
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: 'File is required' }, { status: 400 });
    }

    const rows = parseStockWorkbook(Buffer.from(await file.arrayBuffer()));
    const result = await importInventoryRows(rows, { id: session.id, role: session.role });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
