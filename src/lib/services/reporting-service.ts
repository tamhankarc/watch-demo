import { prisma } from '@/lib/prisma';

function csvEscape(value: unknown) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>) {
  return [headers.map(csvEscape).join(','), ...rows.map(r => r.map(csvEscape).join(','))].join('\n');
}

export async function exportCustomersCsv() {
  const rows = await prisma.customer.findMany({ include: { salesExecutive: true }, orderBy: { updatedAt: 'desc' } });
  return toCsv(['ID','First Name','Last Name','Email','Phone','Sales Executive','Active'],
    rows.map(c => [c.id, c.firstName, c.lastName, c.email ?? '', c.phone ?? '', `${c.salesExecutive.firstName} ${c.salesExecutive.lastName}`, c.isActive ? 'Yes' : 'No'])
  );
}

export async function exportRequirementsCsv() {
  const rows = await prisma.requirement.findMany({ include: { customer: true, salesExecutive: true, brand: true, model: true, watchReference: true }, orderBy: { updatedAt: 'desc' } });
  return toCsv(['ID','Customer','Sales Executive','Brand','Model','Reference','Priority','Status'],
    rows.map(r => [r.id, `${r.customer.firstName} ${r.customer.lastName}`, `${r.salesExecutive.firstName} ${r.salesExecutive.lastName}`, r.brand.name, r.model?.name ?? '', r.watchReference?.referenceNumber ?? '', r.priorityRank ?? '', r.status])
  );
}

export async function exportInventoryCsv() {
  const rows = await prisma.stockItem.findMany({ include: { brand: true, model: true, watchReference: true }, orderBy: { createdAt: 'desc' } });
  return toCsv(['ID','Brand','Model','Reference','Serial','Status'],
    rows.map(i => [i.id, i.brand.name, i.model.name, i.watchReference?.referenceNumber ?? '', i.serialNumber, i.currentStatus])
  );
}

export async function exportAllocationsCsv() {
  const rows = await prisma.allocation.findMany({ include: { customer: true, stockItem: true }, orderBy: { assignedAt: 'desc' } });
  return toCsv(['ID','Customer','Stock Item ID','Serial','Status','Assigned At','Expires At'],
    rows.map(a => [a.id, `${a.customer.firstName} ${a.customer.lastName}`, a.stockItemId, a.stockItem.serialNumber, a.status, a.assignedAt.toISOString(), a.expiresAt.toISOString()])
  );
}

export async function exportSalesSummaryCsv() {
  const rows = await prisma.allocation.findMany({ where: { status: 'SOLD' }, include: { customer: true, stockItem: { include: { brand: true, model: true, watchReference: true } } }, orderBy: { updatedAt: 'desc' } });
  return toCsv(['Allocation ID','Customer','Brand','Model','Reference','Serial','Updated At'],
    rows.map(a => [a.id, `${a.customer.firstName} ${a.customer.lastName}`, a.stockItem.brand.name, a.stockItem.model.name, a.stockItem.watchReference?.referenceNumber ?? '', a.stockItem.serialNumber, a.updatedAt.toISOString()])
  );
}
