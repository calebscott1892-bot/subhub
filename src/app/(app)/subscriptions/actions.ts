"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelFutureNotificationsForSubscription,
  upsertNotificationSchedules,
} from "@/lib/notifications/repository";
import { buildNotificationSchedules } from "@/lib/notifications/schedule";
import {
  createSubscription,
  deleteSubscription,
  DEMO_USER_ID,
  updateSubscription,
} from "@/lib/subscriptions/repository";
import type { Subscription } from "@/lib/subscriptions/types";
import { parseSubscriptionFormData } from "@/lib/subscriptions/validation";

export async function createSubscriptionAction(formData: FormData) {
  const parsed = parseSubscriptionFormData(formData);

  if (!parsed.ok) {
    throw new Error(formatValidationErrors(parsed.errors));
  }

  const subscription = await createSubscription(DEMO_USER_ID, parsed.data);
  await refreshNotificationSchedules(subscription);
  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath("/trials");
  revalidatePath("/notifications");
  redirect(`/subscriptions/${subscription.id}`);
}

export async function updateSubscriptionAction(id: string, formData: FormData) {
  const parsed = parseSubscriptionFormData(formData);

  if (!parsed.ok) {
    throw new Error(formatValidationErrors(parsed.errors));
  }

  const subscription = await updateSubscription(DEMO_USER_ID, id, parsed.data);

  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath(`/subscriptions/${id}`);

  if (!subscription) {
    redirect("/subscriptions");
  }

  await refreshNotificationSchedules(subscription);
  redirect(`/subscriptions/${id}`);
}

export async function deleteSubscriptionAction(id: string) {
  await deleteSubscription(DEMO_USER_ID, id);
  await cancelFutureNotificationsForSubscription(DEMO_USER_ID, id, new Date());
  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath("/trials");
  revalidatePath("/notifications");
  redirect("/subscriptions");
}

function formatValidationErrors(errors: Record<string, string>): string {
  return Object.values(errors).join(" ");
}

async function refreshNotificationSchedules(subscription: Subscription) {
  await cancelFutureNotificationsForSubscription(
    DEMO_USER_ID,
    subscription.id,
    new Date(),
  );
  await upsertNotificationSchedules(
    buildNotificationSchedules({
      subscription,
      userId: DEMO_USER_ID,
      fromDate: new Date().toISOString().slice(0, 10),
      timezone: "Australia/Perth",
    }),
  );
  revalidatePath("/notifications");
  revalidatePath("/trials");
}
