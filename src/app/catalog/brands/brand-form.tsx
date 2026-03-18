'use client';

import { useActionState } from 'react';
import { createBrandAction } from '@/lib/actions';
import { FormMessage } from '@/components/form-message';

export function BrandForm() {
  const [state, formAction, pending] = useActionState(createBrandAction, {});

  return (
    <form action={formAction} className="form">
      <label className="label">
        <span>Brand name</span>
        <input className="input" name="name" placeholder="Rolex" required />
      </label>
      <FormMessage error={state.error} />
      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Saving...' : 'Add / Update Brand'}
      </button>
    </form>
  );
}
