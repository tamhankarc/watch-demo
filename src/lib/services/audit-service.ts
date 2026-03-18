import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type AuditEventInput = {
  entityType: string;
  entityId: string | number;
  action: string;
  actorUserId?: number | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
};

export async function logAuditEvent(input: AuditEventInput) {
  return prisma.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: String(input.entityId),
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      summary: input.summary,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getRecentAuditLogs(limit = 50) {
  return prisma.auditLog.findMany({
    include: {
      actorUser: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
