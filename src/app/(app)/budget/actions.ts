"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveBudgetTargets } from "@/lib/budget/repository";
import { parseBudgetFormData } from "@/lib/budget/validation";
import { DEMO_USER_ID } from "@/lib/subscriptions/repository";

export async function saveBudgetTargetsAction(formData: FormData) {
  const parsed = parseBudgetFormData(formData);

  if (!parsed.ok) {
    throw new Error(Object.values(parsed.errors).join(" "));
  }

  await saveBudgetTargets(DEMO_USER_ID, parsed.data);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  redirect("/budget");
}
