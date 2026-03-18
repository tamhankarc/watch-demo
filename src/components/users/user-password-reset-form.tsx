type Props = {
  action: (formData: FormData) => void;
};

export default function UserPasswordResetForm({ action }: Props) {
  return (
    <form action={action} className="form">
      <label className="label">
        <span>Temporary Password</span>
        <input
          name="newPassword"
          type="password"
          className="input"
          required
          placeholder="Minimum 6 characters"
        />
      </label>

      <button type="submit" className="button secondary">
        Reset Password
      </button>
    </form>
  );
}
