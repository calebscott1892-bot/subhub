"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAuditEvent } from "@/lib/audit/repository";
import { requireUserId } from "@/lib/auth/session";
import { updateCancellationState } from "@/lib/subscriptions/repository";

export async function recordTrialVerdictAction(
  id: string,
  verdict: "Keep" | "Cancel",
) {
  const userId = await requireUserId();
  const subscription = await updateCancellationState(userId, id, {
    trialValueVerdict: verdict,
  });

  if (!subscription) {
    redirect("/trials");
  }

  await recordAuditEvent(userId, {
    entityType: "subscription",
    entityId: id,
    action: "TrialVerdict",
    summary: `${subscription.providerName}: trial verdict - ${
      verdict === "Keep" ? "worth keeping" : "plan to cancel"
    }`,
  });
  revalidatePath("/trials");
  revalidatePath(`/subscriptions/${id}`);
  revalidatePath("/dashboard");

  // Cancel verdicts jump straight to the cancellation workflow.
  if (verdict === "Cancel") {
    redirect(`/subscriptions/${id}`);
  }

  redirect("/trials");
}
