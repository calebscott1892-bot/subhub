import { getCurrentUser } from "@/lib/auth/session";
import { buildSubscriptionCalendar } from "@/lib/calendar/ics";
import { listSubscriptions } from "@/lib/subscriptions/repository";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const subscriptions = await listSubscriptions(user.id);
  const today = new Date().toISOString().slice(0, 10);
  const calendar = buildSubscriptionCalendar(subscriptions, today);

  return new Response(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="subscription-hub.ics"',
    },
  });
}
