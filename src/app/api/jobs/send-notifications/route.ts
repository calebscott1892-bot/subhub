import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ensureGeneratedNotifications } from "@/lib/notifications/generate";
import { sendDueNotifications } from "@/lib/notifications/send";
import { getUserSettings } from "@/lib/settings/repository";

// Vercel Cron invokes with GET and an Authorization: Bearer CRON_SECRET
// header. Processes every user's due reminders, like the JOB_SECRET path.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const users = await prisma.user.findMany();
  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const result = await runForUser(user.id, user.email, now);
    processed += result.processed;
    sent += result.sent;
    failed += result.failed;
  }

  return Response.json({ users: users.length, processed, sent, failed });
}

// Trigger with a logged-in session (sends the current user's due reminders)
// or with the JOB_SECRET header from a scheduler (sends everyone's).
export async function POST(request: Request) {
  const jobSecret = process.env.JOB_SECRET;
  const providedSecret = request.headers.get("x-job-secret");
  const now = new Date();

  if (jobSecret && providedSecret === jobSecret) {
    const users = await prisma.user.findMany();
    let processed = 0;
    let sent = 0;
    let failed = 0;
    let deferredUsers = 0;

    for (const user of users) {
      const result = await runForUser(user.id, user.email, now);
      processed += result.processed;
      sent += result.sent;
      failed += result.failed;

      if (result.deferred) {
        deferredUsers += 1;
      }
    }

    return Response.json({
      users: users.length,
      processed,
      sent,
      failed,
      deferredUsers,
    });
  }

  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  return Response.json(await runForUser(user.id, user.email, now));
}

async function runForUser(userId: string, email: string, now: Date) {
  const settings = await getUserSettings(userId);

  await ensureGeneratedNotifications(userId, now);

  return sendDueNotifications({
    userId,
    recipientEmail: email,
    now,
    quietHours: {
      startHour: settings.quietHoursStart,
      endHour: settings.quietHoursEnd,
      timezone: settings.timezone,
    },
  });
}
