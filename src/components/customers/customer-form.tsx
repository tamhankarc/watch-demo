"use client";

type SalesExecutive = {
  id: number;
  firstName: string;
  lastName: string;
};

type DefaultValues = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  remarks?: string | null;
  salesExecutiveId?: number | null;
  isActive?: boolean;
};

type Props = {
  salesExecutives: SalesExecutive[];
  action: (formData: FormData) => void;
  defaultValues?: DefaultValues;
};

export default function CustomerForm({
  salesExecutives,
  action,
  defaultValues,
}: Props) {
  return (
    <form action={action} className="space-y-5 rounded-xl border bg-white p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <input name="firstName" required defaultValue={defaultValues?.firstName ?? ""} className="rounded-md border px-3 py-2" placeholder="First name" />
        <input name="lastName" required defaultValue={defaultValues?.lastName ?? ""} className="rounded-md border px-3 py-2" placeholder="Last name" />
        <input name="email" defaultValue={defaultValues?.email ?? ""} className="rounded-md border px-3 py-2" placeholder="Email" />
        <input name="phone" defaultValue={defaultValues?.phone ?? ""} className="rounded-md border px-3 py-2" placeholder="Phone" />
        <input name="city" defaultValue={defaultValues?.city ?? ""} className="rounded-md border px-3 py-2" placeholder="City" />
        <input name="state" defaultValue={defaultValues?.state ?? ""} className="rounded-md border px-3 py-2" placeholder="State" />
        <input name="country" defaultValue={defaultValues?.country ?? ""} className="rounded-md border px-3 py-2" placeholder="Country" />
        <select
          name="salesExecutiveId"
          required
          defaultValue={defaultValues?.salesExecutiveId ?? ""}
          className="rounded-md border px-3 py-2"
        >
          <option value="">Select Sales Executive</option>
          {salesExecutives.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
      </div>

      <textarea
        name="remarks"
        rows={4}
        defaultValue={defaultValues?.remarks ?? ""}
        className="w-full rounded-md border px-3 py-2"
        placeholder="Remarks"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={defaultValues?.isActive ?? true}
        />
        Active
      </label>

      <button type="submit" className="rounded-md bg-black px-4 py-2 text-sm text-white">
        Save Customer
      </button>
    </form>
  );
}