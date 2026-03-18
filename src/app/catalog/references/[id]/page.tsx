import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ReferenceEditForm from '@/components/catalog/reference-edit-form';
import { updateReferenceMetadataAction } from '@/actions/catalog-references';
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ReferenceDetailPage({ params }: Props) {
  const session = await requireRole(['ADMIN', 'MANAGER']);
  const { id } = await params;
  const referenceId = Number(id);

  if (Number.isNaN(referenceId)) notFound();

  const reference = await prisma.watchReference.findUnique({
    where: { id: referenceId },
    include: {
      brand: true,
      model: true,
    },
  });

  if (!reference) notFound();

  async function action(formData: FormData) {
    'use server';
    await updateReferenceMetadataAction(referenceId, formData);
  }

  return (
    <DashboardShell user={session} title={`Reference ${reference.referenceNumber}`}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div><strong>Brand:</strong> {reference.brand.name}</div>
        <div><strong>Model:</strong> {reference.model?.name ?? '—'}</div>
        <div><strong>Reference:</strong> {reference.referenceNumber}</div>
      </div>

      <div className="card">
        <ReferenceEditForm
          action={action}
          defaultValues={{
            displayName: reference.displayName,
            imageUrl: reference.imageUrl,
            description: reference.description,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Link href="/catalog/references" className="button secondary">
          Back to References
        </Link>
        <Link href={`/catalog/references/${reference.id}/media`} className="button secondary">
          Manage Media Image
        </Link>
      </div>
    </DashboardShell>
  );
}
