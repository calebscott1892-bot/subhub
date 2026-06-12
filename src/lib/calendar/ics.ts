import { getUpcomingCharges } from "@/lib/budget/forecast";
import { getTrialDeadline } from "@/lib/subscriptions/selectors";
import type { Subscription } from "@/lib/subscriptions/types";

export const DEFAULT_CALENDAR_WINDOW_DAYS = 365;

export function buildSubscriptionCalendar(
  subscriptions: Subscription[],
  fromDate: string,
  windowDays = DEFAULT_CALENDAR_WINDOW_DAYS,
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Subscription Hub//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Subscription Hub",
  ];

  for (const charge of getUpcomingCharges(subscriptions, fromDate, windowDays)) {
    lines.push(
      ...buildEvent({
        uid: `charge-${charge.subscription.id}-${charge.date}@subscription-hub`,
        date: charge.date,
        summary: `${charge.subscription.providerName} renewal (${formatAmount(
          charge.amount,
          charge.subscription.currency,
        )})`,
        description: `${charge.subscription.billingCadence} subscription tracked in Subscription Hub.`,
      }),
    );
  }

  for (const subscription of subscriptions) {
    if (subscription.status !== "Trial") {
      continue;
    }

    const deadline = getTrialDeadline(subscription);

    if (!deadline || deadline < fromDate) {
      continue;
    }

    lines.push(
      ...buildEvent({
        uid: `trial-${subscription.id}@subscription-hub`,
        date: deadline,
        summary: `Cancel-by deadline: ${subscription.providerName}`,
        description:
          "Trial decision deadline tracked in Subscription Hub. Cancel before this day to avoid conversion.",
      }),
    );
  }

  lines.push("END:VCALENDAR");

  return `${lines.join("\r\n")}\r\n`;
}

function buildEvent(event: {
  uid: string;
  date: string;
  summary: string;
  description: string;
}): string[] {
  const day = event.date.replaceAll("-", "");

  return [
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(event.uid)}`,
    `DTSTAMP:${day}T000000Z`,
    `DTSTART;VALUE=DATE:${day}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    "END:VEVENT",
  ];
}

function escapeIcsText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}
