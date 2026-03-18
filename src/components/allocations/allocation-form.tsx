'use client';

import { useMemo, useState } from 'react';

type RequirementOption = {
  id: number;
  brandId: number;
  modelId: number | null;
  watchReferenceId: number | null;
  customer: { firstName: string; lastName: string };
  brand: { name: string };
  model: { name: string } | null;
  watchReference: { referenceNumber: string } | null;
};

type StockItemOption = {
  id: number;
  brandId: number;
  modelId: number;
  watchReferenceId: number | null;
  brand: { name: string };
  model: { name: string };
  watchReference: { referenceNumber: string } | null;
  serialNumber: string;
  currentStatus: string;
};

type Props = {
  requirements: RequirementOption[];
  stockItems: StockItemOption[];
  action: (formData: FormData) => void;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AllocationForm({
  requirements,
  stockItems,
  action,
}: Props) {
  const now = new Date();
  const defaultExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [requirementId, setRequirementId] = useState<number | ''>('');

  const selectedRequirement = useMemo(
    () => requirements.find((r) => r.id === requirementId) ?? null,
    [requirementId, requirements]
  );

  const filteredStockItems = useMemo(() => {
    if (!selectedRequirement) return stockItems;

    return stockItems.filter((item) => {
      if (item.brandId !== selectedRequirement.brandId) return false;
      if (selectedRequirement.modelId && item.modelId !== selectedRequirement.modelId) return false;
      if (
        selectedRequirement.watchReferenceId &&
        item.watchReferenceId !== selectedRequirement.watchReferenceId
      ) return false;
      return true;
    });
  }, [selectedRequirement, stockItems]);

  return (
    <form action={action} className="form space-y-5">
      <label className="label block">
        <span className="mb-2 block">Requirement</span>
        <select
          name="requirementId"
          required
          className="select w-full"
          value={requirementId}
          onChange={(e) => setRequirementId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Select requirement</option>
          {requirements.map((req) => (
            <option key={req.id} value={req.id}>
              #{req.id} • {req.customer.firstName} {req.customer.lastName} • {req.brand.name}
              {req.model ? ` • ${req.model.name}` : ''}
              {req.watchReference ? ` • ${req.watchReference.referenceNumber}` : ''}
            </option>
          ))}
        </select>
      </label>

      {selectedRequirement ? (
        <div className="muted">Matching stock items: {filteredStockItems.length}</div>
      ) : null}

      <label className="label block">
        <span className="mb-2 block">Stock Item</span>
        <select name="stockItemId" required className="select w-full">
          <option value="">Select stock item</option>
          {filteredStockItems.map((item) => (
            <option key={item.id} value={item.id}>
              #{item.id} • {item.brand.name} • {item.model.name}
              {item.watchReference ? ` • ${item.watchReference.referenceNumber}` : ''}
              {` • ${item.serialNumber}`}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="label block">
          <span className="mb-2 block">Expiry Date</span>
          <input
            type="date"
            name="expiresDate"
            required
            min={toDateValue(now)}
            defaultValue={toDateValue(defaultExpiry)}
            className="input w-full"
          />
        </label>

        <label className="label block">
          <span className="mb-2 block">Expiry Time</span>
          <input
            type="time"
            name="expiresTime"
            required
            defaultValue={toTimeValue(defaultExpiry)}
            className="input w-full"
          />
        </label>
      </div>

      <p className="text-xs text-gray-500">Default expiry is set to 7 days from now.</p>

      <button type="submit" className="button">Create Allocation</button>
    </form>
  );
}
