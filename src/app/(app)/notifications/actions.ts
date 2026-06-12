"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { sendDueNotifications } from "@/lib/notifications/send";

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
