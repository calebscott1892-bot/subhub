"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  listHouseholdMembers,
  setSubscriptionSharing,
} from "@/lib/household/repository";
import { cancelFutureNotificationsForSubscription } from "@/lib/notifications/repository";
import { refreshSubscriptionNotifications } from "@/lib/notifications/refresh";
import { computeSplit } from "@/lib/sharing/split-rules";
import { parseSharingFormData } from "@/lib/sharing/validation";
import { calculateMonthlyCost } from "@/lib/subscriptions/costs";
import {
  diffSubscription,
  summarizeSubscriptionUpdate,
} from "@/lib/audit/changes";
import { recordAuditEvent } from "@/lib/audit/repository";
import { requireUserId } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { recordPriceChange } from "@/lib/subscriptions/price-history";
import {
  createSubscription,
  deleteSubscription,
  getSubscriptionById,
  updateCancellationState,
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
  await recordAuditEvent(userId, {
    entityType: "subscription",
    entityId: subscription.id,
    action: "Created",
    summary: `Added ${subscription.providerName} at ${formatCurrency(
      subscription.priceAmount,
      subscription.currency,
    )} ${subscription.billingCadence.toLowerCase()}`,
  });
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

  const before = await getSubscriptionById(userId, id);
  const subscription = await updateSubscription(userId, id, parsed.data);

  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath(`/subscriptions/${id}`);

  if (!subscription) {
    redirect("/subscriptions");
  }

  if (before) {
    await recordSubscriptionChanges(userId, before, subscription);
  }

  await refreshNotificationSchedules(userId, subscription);
  redirect(`/subscriptions/${id}`);
}

export async function deleteSubscriptionAction(id: string) {
  const userId = await requireUserId();
  const subscription = await getSubscriptionById(userId, id);
  await deleteSubscription(userId, id);
  await cancelFutureNotificationsForSubscription(userId, id, new Date());

  if (subscription) {
    await recordAuditEvent(userId, {
      entityType: "subscription",
      entityId: id,
      action: "Deleted",
      summary: `Deleted ${subscription.providerName}`,
    });
  }
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

  const shared = await getSubscriptionById(userId, id);

  if (shared) {
    await recordAuditEvent(userId, {
      entityType: "subscription",
      entityId: id,
      action: "SharingChanged",
      summary:
        parsed.data.splitType === null
          ? `${shared.providerName}: sharing removed`
          : `${shared.providerName}: ${parsed.data.splitType} split with ${parsed.data.shares.length} member${
              parsed.data.shares.length === 1 ? "" : "s"
            }`,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/household");
  revalidatePath(`/subscriptions/${id}`);
  redirect(`/subscriptions/${id}`);
}

export async function markCancellationRequestedAction(
  id: string,
  formData: FormData,
) {
  const userId = await requireUserId();
  const notes =
    String(formData.get("cancellationNotes") ?? "").trim() || null;
  const today = new Date().toISOString().slice(0, 10);
  const subscription = await updateCancellationState(userId, id, {
    cancellationRequestedAt: today,
    cancellationNotes: notes,
  });

  if (!subscription) {
    redirect("/subscriptions");
  }

  await recordAuditEvent(userId, {
    entityType: "subscription",
    entityId: id,
    action: "CancellationRequested",
    summary: `${subscription.providerName}: cancellation requested${
      notes ? ` (${notes})` : ""
    }`,
  });
  revalidatePath(`/subscriptions/${id}`);
  revalidatePath("/dashboard");
  redirect(`/subscriptions/${id}`);
}

export async function markCanceledAction(id: string) {
  const userId = await requireUserId();
  const subscription = await updateCancellationState(userId, id, {
    status: "Canceled",
  });

  if (!subscription) {
    redirect("/subscriptions");
  }

  await cancelFutureNotificationsForSubscription(userId, id, new Date());
  await recordAuditEvent(userId, {
    entityType: "subscription",
    entityId: id,
    action: "MarkedCanceled",
    summary: `${subscription.providerName}: confirmed canceled`,
  });
  revalidatePath(`/subscriptions/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/subscriptions");
  revalidatePath("/budget");
  revalidatePath("/notifications");
  redirect(`/subscriptions/${id}`);
}

function formatValidationErrors(errors: Record<string, string>): string {
  return Object.values(errors).join(" ");
}

async function recordSubscriptionChanges(
  userId: string,
  before: Subscription,
  after: Subscription,
) {
  const changes = diffSubscription(before, after);

  if (changes.length === 0) {
    return;
  }

  const priceChange = changes.find((change) => change.field === "priceAmount");

  if (priceChange) {
    await recordPriceChange(userId, {
      subscriptionId: after.id,
      oldPriceAmount: before.priceAmount,
      newPriceAmount: after.priceAmount,
      currency: after.currency,
      changeDate: new Date().toISOString().slice(0, 10),
      source: "manual-edit",
    });
    await recordAuditEvent(userId, {
      entityType: "subscription",
      entityId: after.id,
      action: "PriceChange",
      summary: `${after.providerName}: ${priceChange.summary}`,
    });
  }

  const statusChange = changes.find((change) => change.field === "status");

  if (statusChange) {
    await recordAuditEvent(userId, {
      entityType: "subscription",
      entityId: after.id,
      action: "StatusChange",
      summary: `${after.providerName}: ${statusChange.summary}`,
    });
  }

  const otherChanges = changes.filter(
    (change) => change.field !== "priceAmount" && change.field !== "status",
  );

  if (otherChanges.length > 0) {
    await recordAuditEvent(userId, {
      entityType: "subscription",
      entityId: after.id,
      action: "Updated",
      summary: summarizeSubscriptionUpdate(after, otherChanges),
    });
  }
}

async function refreshNotificationSchedules(
  userId: string,
  subscription: Subscription,
) {
  await refreshSubscriptionNotifications(userId, subscription);
  revalidatePath("/notifications");
  revalidatePath("/trials");
}
