'use client';

import { useActionState } from 'react';
import { saveCustomerAction } from '@/lib/actions';
import { FormMessage } from '@/components/form-message';

type SalesExecutive = { id: number; firstName: string; lastName: string; email: string };
type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  remarks: string | null;
  salesExecutiveId: number;
} | null;

export function CustomerForm({
  salesExecutives,
  customer,
  lockedSalesExecutiveId,
}: {
  salesExecutives: SalesExecutive[];
  customer: Customer;
  lockedSalesExecutiveId?: number;
}) {
  const [state, formAction, pending] = useActionState(saveCustomerAction, { error: '' });
  const selectedExecutiveId = lockedSalesExecutiveId ?? customer?.salesExecutiveId ?? salesExecutives[0]?.id;

  return (
    <form action={formAction} className="form">
      {customer?.id ? <input type="hidden" name="id" value={customer.id} /> : null}
      <div className="grid grid-2">
        <label className="label">
          <span>First name</span>
          <input className="input" name="firstName" defaultValue={customer?.firstName ?? ''} required />
        </label>
        <label className="label">
          <span>Last name</span>
          <input className="input" name="lastName" defaultValue={customer?.lastName ?? ''} required />
        </label>
      </div>
      <div className="grid grid-2">
        <label className="label">
          <span>Email</span>
          <input className="input" name="email" type="email" defaultValue={customer?.email ?? ''} />
        </label>
        <label className="label">
          <span>Phone</span>
          <input className="input" name="phone" defaultValue={customer?.phone ?? ''} />
        </label>
      </div>
      <div className="grid grid-3">
        <label className="label">
          <span>City</span>
          <input className="input" name="city" defaultValue={customer?.city ?? ''} />
        </label>
        <label className="label">
          <span>State</span>
          <input className="input" name="state" defaultValue={customer?.state ?? ''} />
        </label>
        <label className="label">
          <span>Country</span>
          <input className="input" name="country" defaultValue={customer?.country ?? ''} />
        </label>
      </div>
      <label className="label">
        <span>Sales Executive</span>
        <select
          className="select"
          name="salesExecutiveId"
          defaultValue={String(selectedExecutiveId ?? '')}
          disabled={Boolean(lockedSalesExecutiveId)}
        >
          {salesExecutives.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
        {lockedSalesExecutiveId ? (
          <input type="hidden" name="salesExecutiveId" value={lockedSalesExecutiveId} />
        ) : null}
      </label>
      <label className="label">
        <span>Remarks</span>
        <textarea className="textarea" name="remarks" defaultValue={customer?.remarks ?? ''} />
      </label>
      <FormMessage error={state.error} />
      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
      </button>
    </form>
  );
}
