import { getDefaultTransport, type EmailTransport } from "@/lib/email/provider";
import { prisma } from "@/lib/db/prisma";
import { isWithinQuietHours } from "./alerts";
import {
  listDueNotifications,
  markNotificationOutcome,
  recordNotificationFailure,
  type NotificationStore,
} from "./repository";

export const MAX_SEND_ATTEMPTS = 3;
const RETRY_BASE_MINUTES = 5;

export type SendDueNotificationsResult = {
  processed: number;
  sent: number;
  failed: number;
  deferred: boolean;
};

export type QuietHours = {
  startHour: number | null;
  endHour: number | null;
  timezone: string;
};

// Idempotent: due notifications move to Sent, or retry with capped backoff
// until they are marked Failed, so re-running is always safe.
export async function sendDueNotifications(options: {
  userId: string;
  recipientEmail: string;
  now: Date;
  transport?: EmailTransport;
  store?: NotificationStore;
  quietHours?: QuietHours;
}): Promise<SendDueNotificationsResult> {
  const store = options.store ?? prisma;
  const transport = options.transport ?? getDefaultTransport();

  if (
    options.quietHours &&
    isWithinQuietHours(
      options.now,
      options.quietHours.timezone,
      options.quietHours.startHour,
      options.quietHours.endHour,
    )
  ) {
    return { processed: 0, sent: 0, failed: 0, deferred: true };
  }

  const due = await listDueNotifications(options.userId, options.now, store);

  let sent = 0;
  let failed = 0;

  for (const notification of due) {
    if (notification.channel === "Email") {
      const result = await transport.send({
        to: options.recipientEmail,
        subject: notification.payload.title,
        body: notification.payload.url
          ? `${notification.payload.body}\n\n${notification.payload.url}`
          : notification.payload.body,
      });

      if (!result.ok) {
        failed += 1;
        const attemptCount = notification.attemptCount + 1;
        const retryAt = new Date(
          options.now.getTime() +
            RETRY_BASE_MINUTES * 2 ** attemptCount * 60_000,
        );
        await recordNotificationFailure(
          options.userId,
          notification.id,
          {
            attemptCount,
            lastError: result.error,
            // Exhausted attempts become Failed; otherwise back off and retry.
            outcome: attemptCount >= MAX_SEND_ATTEMPTS ? "Failed" : "Retry",
            retryAt,
          },
          options.now,
          store,
        );
        continue;
      }
    }

    // In-app notifications are "delivered" the moment they become visible in
    // the notification center; marking them sent records that moment.
    sent += 1;
    await markNotificationOutcome(
      options.userId,
      notification.id,
      "Sent",
      options.now,
      store,
    );
  }

  return { processed: due.length, sent, failed, deferred: false };
}
