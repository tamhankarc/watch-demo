import { RoleCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CurrentUser = {
  id: number;
  role: RoleCode;
};

export type CustomerInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  remarks?: string | null;
  salesExecutiveId: number;
  isActive?: boolean;
};

function isPrivileged(role: RoleCode) {
  return role === "ADMIN" || role === "MANAGER";
}

export async function getCustomersForUser(currentUser: CurrentUser) {
  const where =
    currentUser.role === "SALES_EXECUTIVE"
      ? { salesExecutiveId: currentUser.id }
      : {};

  return prisma.customer.findMany({
    where,
    include: {
      salesExecutive: true,
      requirements: true,
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getCustomerById(id: number, currentUser: CurrentUser) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      salesExecutive: true,
      requirements: {
        include: {
          brand: true,
          model: true,
          watchReference: true,
        },
        orderBy: [{ updatedAt: "desc" }],
      },
    },
  });

  if (!customer) throw new Error("Customer not found.");

  if (
    currentUser.role === "SALES_EXECUTIVE" &&
    customer.salesExecutiveId !== currentUser.id
  ) {
    throw new Error("You are not allowed to view this customer.");
  }

  return customer;
}

export async function createCustomer(input: CustomerInput, currentUser: CurrentUser) {
  if (!isPrivileged(currentUser.role)) {
    throw new Error("Only Manager/Admin can create customers.");
  }

  const salesExecutive = await prisma.user.findUnique({
    where: { id: input.salesExecutiveId },
  });

  if (!salesExecutive || salesExecutive.role !== "SALES_EXECUTIVE") {
    throw new Error("Selected sales executive is invalid.");
  }

  return prisma.customer.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      country: input.country?.trim() || null,
      remarks: input.remarks?.trim() || null,
      salesExecutiveId: input.salesExecutiveId,
      isActive: input.isActive ?? true,
    },
    include: {
      salesExecutive: true,
    },
  });
}

export async function updateCustomer(
  id: number,
  input: CustomerInput,
  currentUser: CurrentUser
) {
  const existing = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existing) throw new Error("Customer not found.");

  if (!isPrivileged(currentUser.role)) {
    throw new Error("Only Manager/Admin can update customers.");
  }

  return prisma.customer.update({
    where: { id },
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      country: input.country?.trim() || null,
      remarks: input.remarks?.trim() || null,
      salesExecutiveId: input.salesExecutiveId,
      isActive: input.isActive ?? true,
    },
    include: {
      salesExecutive: true,
    },
  });
}