"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAuditEvent } from "@/lib/audit/repository";
import { refreshSubscriptionNotifications } from "@/lib/notifications/refresh";
import {
  buildCsvImportPreview,
  commitCsvImport,
  type CsvImportPreview,
} from "@/lib/import/commit-import";
import { requireUserId } from "@/lib/auth/session";
import {
  createSubscription,
  listSubscriptions,
} from "@/lib/subscriptions/repository";
import type { Subscription } from "@/lib/subscriptions/types";
import type { SubscriptionFormInput } from "@/lib/subscriptions/validation";

export type CsvImportActionState = {
  csvText: string;
  error: string | null;
  message: string | null;
  preview: CsvImportPreview | null;
};

export async function previewCsvImportAction(
  _previousState: CsvImportActionState,
  formData: FormData,
): Promise<CsvImportActionState> {
  const csvText = await readCsvText(formData);

  if (!csvText.trim()) {
    return {
      csvText: "",
      preview: null,
      message: null,
      error: "Upload a CSV file or paste CSV text before previewing.",
    };
  }

  const userId = await requireUserId();
  const existingSubscriptions = await listSubscriptions(userId);
  const preview = buildCsvImportPreview({ csvText, existingSubscriptions });

  return {
    csvText,
    preview,
    error: null,
    message: `Preview ready: ${preview.validCount} valid row${preview.validCount === 1 ? "" : "s"}, ${preview.invalidCount} invalid row${preview.invalidCount === 1 ? "" : "s"}.`,
  };
}

export async function commitCsvImportAction(formData: FormData) {
  const csvText = String(formData.get("csvText") ?? "");

  if (!csvText.trim()) {
    redirect("/import/csv");
  }

  const userId = await requireUserId();
  const existingSubscriptions = await listSubscriptions(userId);
  const result = await commitCsvImport({
    csvText,
    existingSubscriptions,
    createSubscription: (input) => createImportedSubscription(userId, input),
  });

  if (result.createdCount > 0) {
    await recordAuditEvent(userId, {
      entityType: "import",
      entityId: "csv-import",
      action: "Imported",
      summary: `Imported ${result.createdCount} subscription${
        result.createdCount === 1 ? "" : "s"
      } from CSV`,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath("/trials");
  revalidatePath("/notifications");
  revalidatePath("/import/csv");

  redirect(`/subscriptions?imported=${result.createdCount}`);
}

async function readCsvText(formData: FormData): Promise<string> {
  const pastedCsv = String(formData.get("csvText") ?? "");
  const file = formData.get("csvFile");

  if (file instanceof File && file.size > 0) {
    return file.text();
  }

  return pastedCsv;
}

async function createImportedSubscription(
  userId: string,
  input: SubscriptionFormInput,
): Promise<Subscription> {
  const subscription = await createSubscription(userId, input);
  await refreshSubscriptionNotifications(userId, subscription);
  return subscription;
}
