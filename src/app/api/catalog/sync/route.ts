import { NextResponse } from 'next/server';
import { runFullCatalogSync } from '@/lib/catalog/catalog-import-service';

export async function POST() {
  try {
    await runFullCatalogSync();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
