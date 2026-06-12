"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  listHouseholdMembers,
  setSubscriptionSharing,
} from "@/lib/household/repository";
import {
  cancelFutureNotificationsForSubscription,
  upsertNotificationSchedules,
} from "@/lib/notifications/repository";
import { buildNotificationSchedules } from "@/lib/notifications/schedule";
import { computeSplit } from "@/lib/sharing/split-rules";
import { parseSharingFormData } from "@/lib/sharing/validation";
import { calculateMonthlyCost } from "@/lib/subscriptions/costs";
import { requireUserId } from "@/lib/auth/session";
import {
  createSubscription,
  deleteSubscription,
  getSubscriptionById,
  updateSubscription,
} from "@/lib/subscriptions/repository";
import type { Subscription } from "@/lib/subscriptions/types";
import { parseSubscriptionFormData } from "@/lib/subscriptions/validation";

export async function createSubscriptionAction(formData: FormData) {
  const userId = await requireUserId();
  const parsed = parseSubscriptionFormData(formData);

  if (!parsed.ok) {
    throw new Error(formatValidationErrors(parsed.errors));
  }

  const subscription = await createSubscription(userId, parsed.data);
  await refreshNotificationSchedules(userId, subscription);
  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath("/trials");
  revalidatePath("/notifications");
  redirect(`/subscriptions/${subscription.id}`);
}

export async function updateSubscriptionAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  const parsed = parseSubscriptionFormData(formData);

  if (!parsed.ok) {
    throw new Error(formatValidationErrors(parsed.errors));
  }

  const subscription = await updateSubscription(userId, id, parsed.data);

  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath(`/subscriptions/${id}`);

  if (!subscription) {
    redirect("/subscriptions");
  }

  await refreshNotificationSchedules(userId, subscription);
  redirect(`/subscriptions/${id}`);
}

export async function deleteSubscriptionAction(id: string) {
  const userId = await requireUserId();
  await deleteSubscription(userId, id);
  await cancelFutureNotificationsForSubscription(userId, id, new Date());
  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath("/trials");
  revalidatePath("/notifications");
  redirect("/subscriptions");
}

export async function saveSubscriptionSharingAction(
  id: string,
  formData: FormData,
) {
  const userId = await requireUserId();
  const members = await listHouseholdMembers(userId);
  const parsed = parseSharingFormData(formData, members);

  if (!parsed.ok) {
    throw new Error(formatValidationErrors(parsed.errors));
  }

  if (parsed.data.splitType !== null) {
    const subscription = await getSubscriptionById(userId, id);

    if (!subscription) {
      redirect("/subscriptions");
    }

    const split = computeSplit(
      calculateMonthlyCost(subscription),
      parsed.data.splitType,
      parsed.data.shares,
    );

    if (!split.ok) {
      throw new Error(split.error);
    }
  }

  await setSubscriptionSharing(userId, id, parsed.data);
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/household");
  revalidatePath(`/subscriptions/${id}`);
  redirect(`/subscriptions/${id}`);
}

function formatValidationErrors(errors: Record<string, string>): string {
  return Object.values(errors).join(" ");
}

async function refreshNotificationSchedules(
  userId: string,
  subscription: Subscription,
) {
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
  revalidatePath("/notifications");
  revalidatePath("/trials");
}
