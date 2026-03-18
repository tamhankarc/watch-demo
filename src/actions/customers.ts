"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  createCustomer,
  updateCustomer,
  CurrentUser,
} from "@/lib/services/customer-service";

async function getCurrentUser(): Promise<CurrentUser> {
  const session = await requireAuth();
  return { id: session.id, role: session.role };
}

function toNullableString(v: FormDataEntryValue | null) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function createCustomerAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  await createCustomer(
    {
      firstName: String(formData.get("firstName") || ""),
      lastName: String(formData.get("lastName") || ""),
      email: toNullableString(formData.get("email")),
      phone: toNullableString(formData.get("phone")),
      city: toNullableString(formData.get("city")),
      state: toNullableString(formData.get("state")),
      country: toNullableString(formData.get("country")),
      remarks: toNullableString(formData.get("remarks")),
      salesExecutiveId: Number(formData.get("salesExecutiveId")),
      isActive: formData.get("isActive") === "on",
    },
    currentUser
  );

  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomerAction(id: number, formData: FormData) {
  const currentUser = await getCurrentUser();

  await updateCustomer(
    id,
    {
      firstName: String(formData.get("firstName") || ""),
      lastName: String(formData.get("lastName") || ""),
      email: toNullableString(formData.get("email")),
      phone: toNullableString(formData.get("phone")),
      city: toNullableString(formData.get("city")),
      state: toNullableString(formData.get("state")),
      country: toNullableString(formData.get("country")),
      remarks: toNullableString(formData.get("remarks")),
      salesExecutiveId: Number(formData.get("salesExecutiveId")),
      isActive: formData.get("isActive") === "on",
    },
    currentUser
  );

  revalidatePath("/customers");
  redirect("/customers");
}