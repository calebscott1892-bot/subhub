"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth/session";
import { saveBudgetTargets } from "@/lib/budget/repository";
import { parseBudgetFormData } from "@/lib/budget/validation";

export async function saveBudgetTargetsAction(formData: FormData) {
  const userId = await requireUserId();
  const parsed = parseBudgetFormData(formData);

  if (!parsed.ok) {
    throw new Error(Object.values(parsed.errors).join(" "));
  }

  await saveBudgetTargets(userId, parsed.data);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  redirect("/budget");
}
