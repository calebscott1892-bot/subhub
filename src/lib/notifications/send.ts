import { getDefaultTransport, type EmailTransport } from "@/lib/email/provider";
import { prisma } from "@/lib/db/prisma";
import {
  listDueNotifications,
  markNotificationOutcome,
  type NotificationStore,
} from "./repository";

export type SendDueNotificationsResult = {
  processed: number;
  sent: number;
  failed: number;
};

// Idempotent: due notifications move to Sent/Failed, so re-running is safe.
export async function sendDueNotifications(options: {
  userId: string;
  recipientEmail: string;
  now: Date;
  transport?: EmailTransport;
  store?: NotificationStore;
}): Promise<SendDueNotificationsResult> {
  const store = options.store ?? prisma;
  const transport = options.transport ?? getDefaultTransport();
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
        await markNotificationOutcome(
          options.userId,
          notification.id,
          "Failed",
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

  return { processed: due.length, sent, failed };
}
