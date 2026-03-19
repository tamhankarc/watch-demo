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
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: DefaultValues;
};

export default function CustomerForm({
  salesExecutives,
  action,
  defaultValues,
}: Props) {
  return (
    <form action={action} className="card form">
      <div>
        <h2 style={{ margin: 0 }}>Customer Details</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Add a new customer and assign a sales executive.
        </p>
      </div>

      <div className="grid grid-2">
        <label className="label">
          <span>First name</span>
          <input
            name="firstName"
            required
            defaultValue={defaultValues?.firstName ?? ""}
            placeholder="Enter first name"
            className="input"
          />
        </label>

        <label className="label">
          <span>Last name</span>
          <input
            name="lastName"
            required
            defaultValue={defaultValues?.lastName ?? ""}
            placeholder="Enter last name"
            className="input"
          />
        </label>

        <label className="label">
          <span>Email</span>
          <input
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
            placeholder="customer@example.com"
            className="input"
          />
        </label>

        <label className="label">
          <span>Phone</span>
          <input
            name="phone"
            defaultValue={defaultValues?.phone ?? ""}
            placeholder="Enter phone number"
            className="input"
          />
        </label>

        <label className="label">
          <span>City</span>
          <input
            name="city"
            defaultValue={defaultValues?.city ?? ""}
            placeholder="Enter city"
            className="input"
          />
        </label>

        <label className="label">
          <span>State</span>
          <input
            name="state"
            defaultValue={defaultValues?.state ?? ""}
            placeholder="Enter state"
            className="input"
          />
        </label>

        <label className="label">
          <span>Country</span>
          <input
            name="country"
            defaultValue={defaultValues?.country ?? ""}
            placeholder="Enter country"
            className="input"
          />
        </label>

        <label className="label">
          <span>Sales executive</span>
          <select
            name="salesExecutiveId"
            required
            defaultValue={defaultValues?.salesExecutiveId ?? ""}
            className="select"
          >
            <option value="">Select sales executive</option>
            {salesExecutives.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="label">
        <span>Remarks</span>
        <textarea
          name="remarks"
          rows={4}
          defaultValue={defaultValues?.remarks ?? ""}
          placeholder="Add notes about the customer"
          className="textarea"
        />
      </label>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={defaultValues?.isActive ?? true}
        />
        <span>Active customer</span>
      </label>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="button">
          Save Customer
        </button>
      </div>
    </form>
  );
}