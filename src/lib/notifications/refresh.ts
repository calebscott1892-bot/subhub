import { getUserSettings } from "@/lib/settings/repository";
import type { Subscription } from "@/lib/subscriptions/types";
import {
  cancelFutureNotificationsForSubscription,
  upsertNotificationSchedules,
} from "./repository";
import { buildNotificationSchedules } from "./schedule";

// Rebuilds a subscription's future reminders using the owner's timezone and
// reminder preferences.
export async function refreshSubscriptionNotifications(
  userId: string,
  subscription: Subscription,
): Promise<void> {
  const settings = await getUserSettings(userId);

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
      timezone: settings.timezone,
      preferences: {
        trialReminders: settings.trialReminders,
        renewalReminders: settings.renewalReminders,
      },
    }),
  );
}
