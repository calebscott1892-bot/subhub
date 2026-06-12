"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth/session";
import { parseTransactionsCsv } from "@/lib/detection/parse-transactions";
import { detectRecurringCharges } from "@/lib/detection/recurring";
import {
  getDetectedCandidate,
  saveScanResults,
  setCandidateStatus,
  type DetectedCandidate,
} from "@/lib/detection/repository";
import { buildSampleTransactionsCsv } from "@/lib/detection/sample-transactions";
import {
  cancelFutureNotificationsForSubscription,
  upsertNotificationSchedules,
} from "@/lib/notifications/repository";
import { buildNotificationSchedules } from "@/lib/notifications/schedule";
import {
  createSubscription,
  listSubscriptions,
} from "@/lib/subscriptions/repository";

export async function scanTransactionsAction(formData: FormData) {
  const userId = await requireUserId();
  const csvText = await readCsvText(formData);

  if (!csvText.trim()) {
    redirect("/detected?error=empty");
  }

  await runScan(userId, csvText);
}

export async function scanSampleTransactionsAction() {
  const userId = await requireUserId();
  const today = new Date().toISOString().slice(0, 10);

  await runScan(userId, buildSampleTransactionsCsv(today));
}

async function runScan(userId: string, csvText: string): Promise<never> {
  const parsed = parseTransactionsCsv(csvText);

  if (parsed.transactions.length === 0) {
    redirect("/detected?error=unparseable");
  }

  const existingSubscriptions = await listSubscriptions(userId);
  const candidates = detectRecurringCharges(
    parsed.transactions,
    existingSubscriptions,
  );
  await saveScanResults(userId, candidates);

  revalidatePath("/detected");
  redirect(
    `/detected?scanned=${parsed.transactions.length}&found=${candidates.length}&rowErrors=${parsed.errors.length}`,
  );
}

export async function acceptCandidateAction(id: string) {
  const userId = await requireUserId();
  const candidate = await getDetectedCandidate(userId, id);

  if (!candidate || candidate.status !== "New") {
    redirect("/detected");
  }

  // A candidate matching an existing subscription merges instead of creating
  // a duplicate record.
  if (candidate.matchedSubscriptionId) {
    await setCandidateStatus(userId, id, "Merged");
    revalidatePath("/detected");
    redirect("/detected");
  }

  const subscription = await createSubscription(userId, {
    providerName: candidate.merchantLabel,
    category: candidate.categoryGuess,
    status: "Active",
    billingCadence: candidate.billingCadence,
    intervalDays: candidate.intervalDays,
    priceAmount: candidate.lastAmount,
    currency: "USD",
    startDate: candidate.firstChargeDate,
    renewalDate: candidate.nextEstimatedCharge,
    trialStartDate: null,
    trialEndDate: null,
    cancelByDate: null,
    postTrialPriceAmount: null,
    accountEmailForProvider: null,
    loginUrl: null,
    billingUrl: null,
    cancelUrl: null,
    supportUrl: null,
    paymentMethodLabel: null,
    notes: buildAcceptNote(candidate),
    lastUsageDate: null,
  });

  await cancelFutureNotificationsForSubscription(
    userId,
    subscription.id,
    new Date(),
  );
  await upsertNotificationSchedules(
    buildNotificationSchedules({
      subscription,
      userId,
      fromDate: new Date().toISOString().slice(0, 10),
      timezone: "Australia/Perth",
    }),
  );
  await setCandidateStatus(userId, id, "Accepted");

  revalidatePath("/detected");
  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath("/notifications");
  redirect(`/subscriptions/${subscription.id}`);
}

export async function mergeCandidateAction(id: string) {
  const userId = await requireUserId();
  await setCandidateStatus(userId, id, "Merged");
  revalidatePath("/detected");
  redirect("/detected");
}

export async function dismissCandidateAction(id: string) {
  const userId = await requireUserId();
  await setCandidateStatus(userId, id, "Dismissed");
  revalidatePath("/detected");
  redirect("/detected");
}

function buildAcceptNote(candidate: DetectedCandidate): string {
  return `Detected from ${candidate.occurrenceCount} bank transactions between ${candidate.firstChargeDate} and ${candidate.lastChargeDate}.`;
}

async function readCsvText(formData: FormData): Promise<string> {
  const pastedCsv = String(formData.get("csvText") ?? "");
  const file = formData.get("csvFile");

  if (file instanceof File && file.size > 0) {
    return file.text();
  }

  return pastedCsv;
}
