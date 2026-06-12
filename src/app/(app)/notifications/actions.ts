"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireUserId } from "@/lib/auth/session";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/repository";
import { sendDueNotifications } from "@/lib/notifications/send";

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
  const result = await sendDueNotifications({
    userId: user.id,
    recipientEmail: user.email,
    now: new Date(),
  });

  revalidatePath("/notifications");
  redirect(
    `/notifications?processed=${result.processed}&sent=${result.sent}&failed=${result.failed}`,
  );
}
