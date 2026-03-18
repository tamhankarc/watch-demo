'use client';

import { useState, useTransition } from 'react';
import {
  importInventoryPreviewAction,
  previewInventoryUploadAction,
} from '@/actions/inventory';

type PreviewRow = {
  rowNumber: number;
  brand: string;
  model: string;
  referenceNumber: string;
  serialNumber: string;
  dateReceived: string;
  brandId: number | null;
  modelId: number | null;
  watchReferenceId: number | null;
  valid: boolean;
  errors: string[];
};

export default function StockUploadForm() {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const validRows = previewRows.filter((r) => r.valid).length;
  const invalidRows = previewRows.filter((r) => !r.valid).length;

  return (
    <div className="space-y-6">
      <form
        action={(formData) => {
          startTransition(async () => {
            const rows = await previewInventoryUploadAction(formData);
            setPreviewRows(rows as PreviewRow[]);
            setMessage('');
          });
        }}
        className="space-y-4 rounded-xl border bg-white p-6"
      >
        <input type="file" name="file" accept=".xlsx,.xls" required />
        <button type="submit" className="rounded-md bg-black px-4 py-2 text-sm text-white" disabled={isPending}>
          {isPending ? 'Previewing...' : 'Preview Upload'}
        </button>
      </form>

      {previewRows.length ? (
        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Upload Preview</h3>
              <p className="text-sm text-gray-500">
                Valid rows: {validRows}  Invalid rows: {invalidRows}
              </p>
            </div>

            <button
              type="button"
              className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
              disabled={isPending || validRows === 0}
              onClick={() => {
                startTransition(async () => {
                  const result = await importInventoryPreviewAction(JSON.stringify(previewRows));
                  setMessage(`Imported ${result.imported} of ${result.total} rows`);
                  setPreviewRows([]);
                });
              }}
            >
              {isPending ? 'Importing...' : 'Confirm Import'}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Reference</th>
                  <th>Serial</th>
                  <th>Date</th>
                  <th>Valid</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>{row.rowNumber}</td>
                    <td>{row.brand}</td>
                    <td>{row.model}</td>
                    <td>{row.referenceNumber || ''}</td>
                    <td>{row.serialNumber}</td>
                    <td>{row.dateReceived}</td>
                    <td>{row.valid ? 'Yes' : 'No'}</td>
                    <td>{row.errors.length ? row.errors.join(', ') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {message ? <div className="rounded-xl border bg-white p-4 text-sm">{message}</div> : null}
    </div>
  );
}
