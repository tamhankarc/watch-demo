"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  changeRequirementStatus,
  createRequirement,
  CurrentUser,
  updateRequirement,
} from "@/lib/services/requirement-service";

async function getCurrentUser(): Promise<CurrentUser> {
  const session = await requireAuth();
  return { id: session.id, role: session.role };
}

function toNullableInt(value: FormDataEntryValue | null) {
  if (value === null || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toNullableString(value: FormDataEntryValue | null) {
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

export async function createRequirementAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  await createRequirement(
    {
      customerId: Number(formData.get("customerId")),
      brandId: Number(formData.get("brandId")),
      modelId: toNullableInt(formData.get("modelId")),
      watchReferenceId: toNullableInt(formData.get("watchReferenceId")),
      priorityRank: toNullableInt(formData.get("priorityRank")),
      notes: toNullableString(formData.get("notes")),
      status: "WAITING",
    },
    currentUser
  );

  revalidatePath("/requirements");
  redirect("/requirements");
}

export async function updateRequirementAction(id: number, formData: FormData) {
  const currentUser = await getCurrentUser();

  await updateRequirement(
    id,
    {
      customerId: Number(formData.get("customerId")),
      brandId: Number(formData.get("brandId")),
      modelId: toNullableInt(formData.get("modelId")),
      watchReferenceId: toNullableInt(formData.get("watchReferenceId")),
      priorityRank: toNullableInt(formData.get("priorityRank")),
      notes: toNullableString(formData.get("notes")),
      status: (formData.get("status") as
        | "WAITING"
        | "ASSIGNED"
        | "SOLD"
        | "CANCELLED"
        | null) ?? undefined,
    },
    currentUser
  );

  revalidatePath("/requirements");
  redirect("/requirements");
}

export async function changeRequirementStatusAction(
  id: number,
  status: "WAITING" | "ASSIGNED" | "SOLD" | "CANCELLED"
) {
  const currentUser = await getCurrentUser();
  await changeRequirementStatus(id, status, currentUser);
  revalidatePath("/requirements");
  revalidatePath(`/requirements/${id}`);
}