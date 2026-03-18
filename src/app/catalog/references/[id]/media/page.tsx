import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateReferenceMediaAction } from '@/actions/reference-media';

type Props = { params: Promise<{ id: string }> };

export default async function ReferenceMediaPage({ params }: Props) {
  const session = await requireRole(['ADMIN', 'MANAGER']);
  const { id } = await params;
  const referenceId = Number(id);
  if (Number.isNaN(referenceId)) notFound();

  const reference = await prisma.watchReference.findUnique({
    where: { id: referenceId },
    include: { brand: true, model: true },
  });
  if (!reference) notFound();

  async function action(formData: FormData) {
    'use server';
    await updateReferenceMediaAction(referenceId, formData);
  }

  return (
    <DashboardShell user={session} title={`Reference Media • ${reference.referenceNumber}`}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div><strong>Brand:</strong> {reference.brand.name}</div>
        <div><strong>Model:</strong> {reference.model?.name ?? '—'}</div>
        <div><strong>Reference:</strong> {reference.referenceNumber}</div>
      </div>

      <div className="card">
        {reference.imageUrl ? (
          <div style={{ marginBottom: 16 }}>
            <img src={reference.imageUrl} alt={reference.displayName} style={{ maxWidth: 220, borderRadius: 8 }} />
          </div>
        ) : null}

        <form action={action} className="form">
          <label className="label">
            <span>Image URL</span>
            <input name="imageUrl" className="input" defaultValue={reference.imageUrl ?? ''} placeholder="https://... or leave blank if uploading" />
          </label>

          <label className="label">
            <span>Upload Image File</span>
            <input type="file" name="imageFile" accept="image/*" className="input" />
          </label>

          <button type="submit" className="button">Save Media</button>
        </form>
      </div>
    </DashboardShell>
  );
}
