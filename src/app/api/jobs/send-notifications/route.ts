import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { sendDueNotifications } from "@/lib/notifications/send";

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

    for (const user of users) {
      const result = await sendDueNotifications({
        userId: user.id,
        recipientEmail: user.email,
        now,
      });
      processed += result.processed;
      sent += result.sent;
      failed += result.failed;
    }

    return Response.json({ users: users.length, processed, sent, failed });
  }

  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await sendDueNotifications({
    userId: user.id,
    recipientEmail: user.email,
    now,
  });

  return Response.json(result);
}
