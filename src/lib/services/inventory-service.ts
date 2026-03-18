import { RoleCode } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ParsedStockRow } from '@/lib/excel/stock-upload';

export type CurrentUser = { id: number; role: RoleCode };

function ensurePrivileged(user: CurrentUser) {
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    throw new Error('Only Manager/Admin can upload inventory.');
  }
}

export async function previewInventoryRows(rows: ParsedStockRow[]) {
  const results = [];

  for (const row of rows) {
    const brand = await prisma.brand.findFirst({ where: { name: row.brand } });
    const model = brand
      ? await prisma.model.findFirst({
          where: { brandId: brand.id, name: row.model },
        })
      : null;

    const watchReference =
      brand && row.referenceNumber
        ? await prisma.watchReference.findFirst({
            where: {
              brandId: brand.id,
              referenceNumber: row.referenceNumber,
            },
          })
        : null;

    const duplicateSerial = row.serialNumber
      ? await prisma.stockItem.findFirst({
          where: { serialNumber: row.serialNumber },
          select: { id: true },
        })
      : null;

    const errors: string[] = [];
    if (!brand) errors.push('Brand not found');
    if (!model) errors.push('Model not found');
    if (row.referenceNumber && !watchReference) errors.push('Reference not found');
    if (!row.serialNumber) errors.push('Serial number missing');
    if (duplicateSerial) errors.push('Serial number already exists');

    results.push({
      ...row,
      brandId: brand?.id ?? null,
      modelId: model?.id ?? null,
      watchReferenceId: watchReference?.id ?? null,
      valid: errors.length === 0,
      errors,
    });
  }

  return results;
}

export async function importInventoryPreviewRows(
  previewRows: Array<{
    rowNumber: number;
    brandId: number | null;
    modelId: number | null;
    watchReferenceId: number | null;
    serialNumber: string;
    dateReceived: string;
    valid: boolean;
  }>,
  currentUser: CurrentUser
) {
  ensurePrivileged(currentUser);

  const validRows = previewRows.filter((r) => r.valid);

  for (const row of validRows) {
    await prisma.stockItem.create({
      data: {
        brandId: row.brandId!,
        modelId: row.modelId!,
        watchReferenceId: row.watchReferenceId,
        serialNumber: row.serialNumber,
        dateReceived: new Date(row.dateReceived),
        currentStatus: 'AVAILABLE',
        isActive: true,
      },
    });
  }

  return {
    total: previewRows.length,
    imported: validRows.length,
    failed: previewRows.length - validRows.length,
  };
}
