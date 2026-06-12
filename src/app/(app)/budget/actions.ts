"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAuditEvent } from "@/lib/audit/repository";
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
  await recordAuditEvent(userId, {
    entityType: "budget",
    entityId: "budget",
    action: "BudgetUpdated",
    summary:
      parsed.data.monthlyTarget !== null
        ? `Budget targets saved (overall ${parsed.data.monthlyTarget}/mo)`
        : "Budget targets saved (no overall target)",
  });
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  redirect("/budget");
}
