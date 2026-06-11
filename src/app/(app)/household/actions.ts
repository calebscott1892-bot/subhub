"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  INVITABLE_ROLES,
  type HouseholdRole,
} from "@/lib/household/permissions";
import {
  addHouseholdMember,
  removeHouseholdMember,
} from "@/lib/household/repository";
import { DEMO_USER_ID } from "@/lib/subscriptions/repository";

export async function addHouseholdMemberAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "");

  if (!name) {
    throw new Error("Member name is required.");
  }

  if (!(INVITABLE_ROLES as readonly string[]).includes(role)) {
    throw new Error("Choose a supported household role.");
  }

  await addHouseholdMember(
    DEMO_USER_ID,
    { name, email, role: role as HouseholdRole },
    );
  revalidatePath("/household");
  redirect("/household");
}

export async function removeHouseholdMemberAction(memberId: string) {
  await removeHouseholdMember(DEMO_USER_ID, memberId);
  revalidatePath("/household");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/subscriptions");
  redirect("/household");
}
