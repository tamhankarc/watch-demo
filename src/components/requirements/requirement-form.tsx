"use client";

import { useMemo, useState } from "react";

type Customer = {
  id: number;
  firstName: string;
  lastName: string;
};

type Brand = {
  id: number;
  name: string;
};

type Model = {
  id: number;
  name: string;
  brandId: number;
};

type WatchReference = {
  id: number;
  referenceNumber: string;
  brandId: number;
  modelId: number | null;
};

type DefaultValues = {
  customerId?: number | null;
  brandId?: number | null;
  modelId?: number | null;
  watchReferenceId?: number | null;
  priorityRank?: number | null;
  notes?: string | null;
};

type Props = {
  customers: Customer[];
  brands: Brand[];
  models: Model[];
  references: WatchReference[];
  action: (formData: FormData) => void;
  defaultValues?: DefaultValues;
  lockedCustomerId?: number;
};

export default function RequirementForm({
  customers,
  brands,
  models,
  references,
  action,
  defaultValues,
  lockedCustomerId,
}: Props) {
  const [brandId, setBrandId] = useState<number | "">(defaultValues?.brandId ?? "");
  const [modelId, setModelId] = useState<number | "">(defaultValues?.modelId ?? "");
  const [watchReferenceId, setWatchReferenceId] = useState<number | "">(defaultValues?.watchReferenceId ?? "");

  const filteredModels = useMemo(() => {
    if (!brandId) return [];
    return models.filter((model) => model.brandId === Number(brandId));
  }, [brandId, models]);

  const filteredReferences = useMemo(() => {
    if (!brandId) return [];
    if (modelId) {
      return references.filter(
        (ref) => ref.brandId === Number(brandId) && ref.modelId === Number(modelId)
      );
    }
    return references.filter((ref) => ref.brandId === Number(brandId));
  }, [brandId, modelId, references]);

  return (
    <form action={action} className="form">
      <div className="grid grid-2">
        <label className="label">
          <span>Customer</span>
          <select
            name="customerId"
            className="select"
            required
            defaultValue={lockedCustomerId ?? defaultValues?.customerId ?? ""}
            disabled={Boolean(lockedCustomerId)}
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.firstName} {customer.lastName}
              </option>
            ))}
          </select>
          {lockedCustomerId ? <input type="hidden" name="customerId" value={lockedCustomerId} /> : null}
        </label>

        <label className="label">
          <span>Brand</span>
          <select
            name="brandId"
            className="select"
            required
            value={brandId}
            onChange={(e) => {
              const nextBrandId = e.target.value ? Number(e.target.value) : "";
              setBrandId(nextBrandId);
              setModelId("");
              setWatchReferenceId("");
            }}
          >
            <option value="">Select brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-2">
        <label className="label">
          <span>Model</span>
          <select
            name="modelId"
            className="select"
            value={modelId}
            onChange={(e) => {
              const nextModelId = e.target.value ? Number(e.target.value) : "";
              setModelId(nextModelId);
              setWatchReferenceId("");
            }}
            disabled={!brandId}
          >
            <option value="">Optional</option>
            {filteredModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>

        <label className="label">
          <span>Watch Reference</span>
          <select
            name="watchReferenceId"
            className="select"
            value={watchReferenceId}
            onChange={(e) => setWatchReferenceId(e.target.value ? Number(e.target.value) : "")}
            disabled={!brandId}
          >
            <option value="">Optional</option>
            {filteredReferences.map((ref) => (
              <option key={ref.id} value={ref.id}>
                {ref.referenceNumber}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-2">
        <label className="label">
          <span>Priority Rank</span>
          <input
            className="input"
            name="priorityRank"
            type="number"
            min="1"
            defaultValue={defaultValues?.priorityRank ?? ""}
            placeholder="Optional"
          />
        </label>
      </div>

      <label className="label">
        <span>Notes</span>
        <textarea
          className="textarea"
          name="notes"
          rows={5}
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Customer preference, urgency, history, remarks..."
        />
      </label>

      <button className="button" type="submit">Save Requirement</button>
    </form>
  );
}
