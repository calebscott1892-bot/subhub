"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { destroySession, requireUser, requireUserId } from "@/lib/auth/session";
import {
  deleteAccount,
  saveProfile,
  saveReminderSettings,
  TIMEZONE_OPTIONS,
} from "@/lib/settings/repository";

export async function saveProfileAction(formData: FormData) {
  const userId = await requireUserId();
  const displayName =
    String(formData.get("displayName") ?? "").trim() || null;
  const timezone = String(formData.get("timezone") ?? "");

  if (!(TIMEZONE_OPTIONS as readonly string[]).includes(timezone)) {
    throw new Error("Choose a supported timezone.");
  }

  await saveProfile(userId, { displayName, timezone });
  revalidatePath("/settings");
  redirect("/settings?saved=profile");
}

export async function saveReminderSettingsAction(formData: FormData) {
  const userId = await requireUserId();

  await saveReminderSettings(userId, {
    trialReminders: formData.get("trialReminders") === "on",
    renewalReminders: formData.get("renewalReminders") === "on",
    monthlyReview: formData.get("monthlyReview") === "on",
    quietHoursStart: parseHour(formData.get("quietHoursStart")),
    quietHoursEnd: parseHour(formData.get("quietHoursEnd")),
  });
  revalidatePath("/settings");
  redirect("/settings?saved=reminders");
}

function parseHour(value: FormDataEntryValue | null): number | null {
  const parsed = Number(String(value ?? ""));

  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 23
    ? parsed
    : null;
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();

  if (formData.get("confirmDelete") !== "on") {
    redirect("/settings?error=confirm");
  }

  await deleteAccount(user.id);
  await destroySession();
  redirect("/signup");
}
