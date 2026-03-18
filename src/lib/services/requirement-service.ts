import { RoleCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CurrentUser = {
  id: number;
  role: RoleCode;
};

export type RequirementInput = {
  customerId: number;
  brandId: number;
  modelId?: number | null;
  watchReferenceId?: number | null;
  priorityRank?: number | null;
  notes?: string | null;
  status?: "WAITING" | "ASSIGNED" | "SOLD" | "CANCELLED";
};

export type RequirementFilters = {
  status?: "WAITING" | "ASSIGNED" | "SOLD" | "CANCELLED";
  brandId?: number;
  salesExecutiveId?: number;
  customerSearch?: string;
};

function isPrivileged(role: RoleCode) {
  return role === "ADMIN" || role === "MANAGER";
}

async function validateRequirementRelations(input: RequirementInput) {
  const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
  if (!brand) throw new Error("Selected brand does not exist.");

  if (input.modelId) {
    const model = await prisma.model.findUnique({ where: { id: input.modelId } });
    if (!model) throw new Error("Selected model does not exist.");
    if (model.brandId !== input.brandId) {
      throw new Error("Selected model does not belong to selected brand.");
    }
  }

  if (input.watchReferenceId) {
    const ref = await prisma.watchReference.findUnique({ where: { id: input.watchReferenceId } });
    if (!ref) throw new Error("Selected reference does not exist.");
    if (ref.brandId !== input.brandId) {
      throw new Error("Selected reference does not belong to selected brand.");
    }
    if (input.modelId && ref.modelId && ref.modelId !== input.modelId) {
      throw new Error("Selected reference does not belong to selected model.");
    }
  }
}

function validateStatusForCreate(currentUser: CurrentUser, status?: RequirementInput["status"]) {
  if (!status || status === "WAITING") return "WAITING" as const;
  if (status === "ASSIGNED") {
    throw new Error("Requirements cannot be created as ASSIGNED. Use allocation flow.");
  }
  if (status === "SOLD" && !isPrivileged(currentUser.role)) {
    throw new Error("Only Manager/Admin can create SOLD requirements.");
  }
  if (status === "CANCELLED" && !isPrivileged(currentUser.role)) {
    throw new Error("Only Manager/Admin can create CANCELLED requirements directly.");
  }
  return status;
}

function validateStatusForUpdate(currentUser: CurrentUser, nextStatus: RequirementInput["status"] | undefined) {
  if (!nextStatus) return;
  if (nextStatus === "ASSIGNED") {
    throw new Error("ASSIGNED status must be set through allocation flow.");
  }
  if (nextStatus === "SOLD" && !isPrivileged(currentUser.role)) {
    throw new Error("Only Manager/Admin can mark requirement as SOLD.");
  }
}

export async function getRequirementsForUser(currentUser: CurrentUser, filters: RequirementFilters = {}) {
  const where: any = {};

  if (currentUser.role === "SALES_EXECUTIVE") {
    where.salesExecutiveId = currentUser.id;
  } else if (filters.salesExecutiveId) {
    where.salesExecutiveId = filters.salesExecutiveId;
  }

  if (filters.status) where.status = filters.status;
  if (filters.brandId) where.brandId = filters.brandId;

  if (filters.customerSearch?.trim()) {
    const q = filters.customerSearch.trim();
    where.customer = {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  return prisma.requirement.findMany({
    where,
    include: {
      customer: true,
      salesExecutive: true,
      brand: true,
      model: true,
      watchReference: true,
      allocations: true,
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getRequirementById(id: number, currentUser: CurrentUser) {
  const requirement = await prisma.requirement.findUnique({
    where: { id },
    include: {
      customer: true,
      salesExecutive: true,
      brand: true,
      model: true,
      watchReference: true,
      allocations: true,
    },
  });

  if (!requirement) throw new Error("Requirement not found.");
  if (currentUser.role === "SALES_EXECUTIVE" && requirement.salesExecutiveId !== currentUser.id) {
    throw new Error("You are not allowed to view this requirement.");
  }

  return requirement;
}

export async function createRequirement(input: RequirementInput, currentUser: CurrentUser) {
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new Error("Customer not found.");

  if (currentUser.role === "SALES_EXECUTIVE" && customer.salesExecutiveId !== currentUser.id) {
    throw new Error("You are not allowed to create requirements for this customer.");
  }

  await validateRequirementRelations(input);
  const finalStatus = validateStatusForCreate(currentUser, input.status);

  return prisma.requirement.create({
    data: {
      customerId: input.customerId,
      salesExecutiveId: customer.salesExecutiveId,
      brandId: input.brandId,
      modelId: input.modelId ?? null,
      watchReferenceId: input.watchReferenceId ?? null,
      priorityRank: input.priorityRank ?? null,
      notes: input.notes ?? null,
      status: finalStatus,
    },
  });
}

export async function updateRequirement(id: number, input: RequirementInput, currentUser: CurrentUser) {
  const existing = await prisma.requirement.findUnique({ where: { id } });
  if (!existing) throw new Error("Requirement not found.");

  if (currentUser.role === "SALES_EXECUTIVE" && existing.salesExecutiveId !== currentUser.id) {
    throw new Error("You are not allowed to update this requirement.");
  }

  await validateRequirementRelations(input);
  validateStatusForUpdate(currentUser, input.status);

  return prisma.requirement.update({
    where: { id },
    data: {
      customerId: input.customerId,
      brandId: input.brandId,
      modelId: input.modelId ?? null,
      watchReferenceId: input.watchReferenceId ?? null,
      priorityRank: input.priorityRank ?? null,
      notes: input.notes ?? null,
      status: input.status ?? existing.status,
    },
  });
}

export async function changeRequirementStatus(
  id: number,
  status: "WAITING" | "CANCELLED" | "SOLD" | "ASSIGNED",
  currentUser: CurrentUser
) {
  const existing = await prisma.requirement.findUnique({ where: { id } });
  if (!existing) throw new Error("Requirement not found.");

  if (currentUser.role === "SALES_EXECUTIVE" && existing.salesExecutiveId !== currentUser.id) {
    throw new Error("You are not allowed to update this requirement.");
  }

  validateStatusForUpdate(currentUser, status);
  return prisma.requirement.update({ where: { id }, data: { status } });
}
