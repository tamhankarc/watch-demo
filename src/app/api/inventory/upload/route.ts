import { NextResponse } from 'next/server';
import { parseStockWorkbook } from '@/lib/excel/stock-upload';
import { previewInventoryRows } from '@/lib/services/inventory-service';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: 'File is required' }, { status: 400 });
    }

    const rows = parseStockWorkbook(Buffer.from(await file.arrayBuffer()));
    const preview = await previewInventoryRows(rows);

    return NextResponse.json({
      ok: true,
      rowCount: rows.length,
      preview,
      validCount: preview.filter((row) => row.valid).length,
      invalidCount: preview.filter((row) => !row.valid).length,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
