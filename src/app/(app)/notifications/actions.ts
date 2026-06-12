"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireUserId } from "@/lib/auth/session";
import { ensureGeneratedNotifications } from "@/lib/notifications/generate";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/repository";
import { sendDueNotifications } from "@/lib/notifications/send";
import { getUserSettings } from "@/lib/settings/repository";

export async function markNotificationReadAction(id: string) {
  const userId = await requireUserId();
  await markNotificationRead(userId, id, new Date());
  revalidatePath("/notifications");
  redirect("/notifications");
}

export async function markAllNotificationsReadAction() {
  const userId = await requireUserId();
  await markAllNotificationsRead(userId, new Date());
  revalidatePath("/notifications");
  redirect("/notifications");
}

export async function sendDueNotificationsAction() {
  const user = await requireUser();
  const now = new Date();
  const settings = await getUserSettings(user.id);

  await ensureGeneratedNotifications(user.id, now);
  const result = await sendDueNotifications({
    userId: user.id,
    recipientEmail: user.email,
    now,
    quietHours: {
      startHour: settings.quietHoursStart,
      endHour: settings.quietHoursEnd,
      timezone: settings.timezone,
    },
  });

  revalidatePath("/notifications");

  if (result.deferred) {
    redirect("/notifications?deferred=1");
  }

  redirect(
    `/notifications?processed=${result.processed}&sent=${result.sent}&failed=${result.failed}`,
  );
}
