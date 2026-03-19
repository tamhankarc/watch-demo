import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RequirementDetailPage({ params }: Props) {
  const session = await requireAuth();

  const { id } = await params;

  const requirement = await prisma.requirement.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      salesExecutive: true,
    },
  });

  if (!requirement) return notFound();

  return (
    <DashboardShell user={session} title="Requirement Details">
      <div className="container">
        {/* 🔙 Back Button */}
        <div style={{ marginBottom: 16 }}>
          <a
            href="/requirements"
            className="button"
            style={{ width: "fit-content" }}
          >
            ← Back to Requirements
          </a>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 8 }}>
            Requirement #{requirement.id}
          </h1>
          <p className="muted">View customer requirement details</p>
        </div>

        {/* Main Card */}
        <div className="card" style={{ display: "grid", gap: 16 }}>
          <div>
            <strong>Customer:</strong>{" "}
            {requirement.customer?.firstName}{" "}
            {requirement.customer?.lastName}
          </div>

          <div>
            <strong>Sales Executive:</strong>{" "}
            {requirement.salesExecutive?.firstName}{" "}
            {requirement.salesExecutive?.lastName}
          </div>

          {/* ✅ Status Badge */}
          <div>
            <strong>Status:</strong>{" "}
            <span className="badge">{requirement.status}</span>
          </div>

          <div>
            <strong>Notes:</strong>
            <div className="muted" style={{ marginTop: 4 }}>
              {requirement.notes || "—"}
            </div>
          </div>

          <div>
            <strong>Created At:</strong>{" "}
            {new Date(requirement.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}