type DefaultValues = {
  displayName?: string | null;
  imageUrl?: string | null;
  description?: string | null;
};

type Props = {
  action: (formData: FormData) => void;
  defaultValues?: DefaultValues;
};

export default function ReferenceEditForm({ action, defaultValues }: Props) {
  return (
    <form action={action} className="form">
      <label className="label">
        <span>Display Name</span>
        <input
          name="displayName"
          className="input"
          defaultValue={defaultValues?.displayName ?? ''}
          placeholder="Display name"
        />
      </label>

      <label className="label">
        <span>Image URL</span>
        <input
          name="imageUrl"
          className="input"
          defaultValue={defaultValues?.imageUrl ?? ''}
          placeholder="https://..."
        />
      </label>

      <label className="label">
        <span>Description</span>
        <textarea
          name="description"
          rows={6}
          className="input"
          defaultValue={defaultValues?.description ?? ''}
          placeholder="Optional manual description"
        />
      </label>

      <button className="button" type="submit">
        Save Reference
      </button>
    </form>
  );
}
