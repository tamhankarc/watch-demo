import { prisma } from '@/lib/prisma';
import { RoleCode } from '@prisma/client';

export type CurrentUser = {
  id: number;
  role: RoleCode;
};

function ensurePrivileged(user: CurrentUser) {
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    throw new Error('Only Manager/Admin can update references.');
  }
}

export async function updateReferenceMetadata(
  id: number,
  input: {
    displayName?: string | null;
    imageUrl?: string | null;
    description?: string | null;
  },
  currentUser: CurrentUser
) {
  ensurePrivileged(currentUser);

  const existing = await prisma.watchReference.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Watch reference not found.');
  }

  return prisma.watchReference.update({
    where: { id },
    data: {
      displayName: input.displayName?.trim() || existing.displayName,
      imageUrl: input.imageUrl?.trim() || null,
      description: input.description?.trim() || null,
      lastSyncedAt: new Date(),
    },
  });
}
