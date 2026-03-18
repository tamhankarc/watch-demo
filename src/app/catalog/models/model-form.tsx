'use client';

import { useActionState } from 'react';
import { createModelAction } from '@/lib/actions';
import { FormMessage } from '@/components/form-message';

export function ModelForm({ brands }: { brands: { id: number; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createModelAction, { error: '' });

  return (
    <form action={formAction} className="form">
      <label className="label">
        <span>Brand</span>
        <select className="select" name="brandId" required>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </label>
      <label className="label">
        <span>Model name</span>
        <input className="input" name="name" placeholder="Submariner Date" required />
      </label>
      <FormMessage error={state.error} />
      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Saving...' : 'Add / Update Model'}
      </button>
    </form>
  );
}
