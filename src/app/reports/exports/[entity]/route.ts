import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import {
  exportAllocationsCsv,
  exportCustomersCsv,
  exportInventoryCsv,
  exportRequirementsCsv,
  exportSalesSummaryCsv,
} from '@/lib/services/reporting-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  await requireRole(['ADMIN', 'MANAGER']);
  const { entity } = await params;

  let csv = '';
  let filename = '';

  switch (entity) {
    case 'customers':
      csv = await exportCustomersCsv();
      filename = 'customers.csv';
      break;
    case 'requirements':
      csv = await exportRequirementsCsv();
      filename = 'requirements.csv';
      break;
    case 'inventory':
      csv = await exportInventoryCsv();
      filename = 'inventory.csv';
      break;
    case 'allocations':
      csv = await exportAllocationsCsv();
      filename = 'allocations.csv';
      break;
    case 'sales-summary':
      csv = await exportSalesSummaryCsv();
      filename = 'sales-summary.csv';
      break;
    default:
      return new NextResponse('Unknown export', { status: 404 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
