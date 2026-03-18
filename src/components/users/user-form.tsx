'use client';

import { RoleCode } from '@prisma/client';

type DefaultValues = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: RoleCode | null;
  isActive?: boolean;
};

type Props = {
  action: (formData: FormData) => void;
  currentUserRole: RoleCode;
  defaultValues?: DefaultValues;
  mode: 'create' | 'edit';
};

export default function UserForm({
  action,
  currentUserRole,
  defaultValues,
  mode,
}: Props) {
  const roleOptions =
    currentUserRole === 'ADMIN'
      ? [
          { value: 'MANAGER', label: 'Manager' },
          { value: 'SALES_EXECUTIVE', label: 'Sales Executive' },
        ]
      : [{ value: 'SALES_EXECUTIVE', label: 'Sales Executive' }];

  return (
    <form action={action} className="form">
      <div className="grid grid-2">
        <label className="label">
          <span>First Name</span>
          <input
            name="firstName"
            className="input"
            required
            defaultValue={defaultValues?.firstName ?? ''}
          />
        </label>

        <label className="label">
          <span>Last Name</span>
          <input
            name="lastName"
            className="input"
            required
            defaultValue={defaultValues?.lastName ?? ''}
          />
        </label>

        <label className="label">
          <span>Email</span>
          <input
            name="email"
            type="email"
            className="input"
            required
            defaultValue={defaultValues?.email ?? ''}
          />
        </label>

        <label className="label">
          <span>Role</span>
          <select
            name="role"
            className="select"
            required
            defaultValue={defaultValues?.role ?? roleOptions[0].value}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="label">
          <span>{mode === 'create' ? 'Password' : 'New Password (optional)'}</span>
          <input
            name="password"
            type="password"
            className="input"
            required={mode === 'create'}
            placeholder={mode === 'create' ? 'Minimum 6 characters' : 'Leave blank to keep current password'}
          />
        </label>
      </div>

      <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={defaultValues?.isActive ?? true}
        />
        <span>Active</span>
      </label>

      <button type="submit" className="button">
        {mode === 'create' ? 'Create User' : 'Save User'}
      </button>
    </form>
  );
}
