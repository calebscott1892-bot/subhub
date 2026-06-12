import { describe, expect, test } from "vitest";
import { buildSubscriptionCalendar } from "@/lib/calendar/ics";
import type { Subscription } from "@/lib/subscriptions/types";

const fromDate = "2026-06-12";

describe("ICS calendar export", () => {
  test("emits renewal events with escaped summaries and date-only starts", () => {
    const ics = buildSubscriptionCalendar(
      [
        makeSubscription({
          id: "netflix",
          providerName: "Netflix, Premium",
          priceAmount: 22.99,
          renewalDate: "2026-06-28",
        }),
      ],
      fromDate,
      90,
    );

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260628");
    expect(ics).toContain("SUMMARY:Netflix\\, Premium renewal (USD 22.99)");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  test("includes trial cancel-by deadlines and rolls stale renewals forward", () => {
    const ics = buildSubscriptionCalendar(
      [
        makeSubscription({
          id: "trial",
          status: "Trial",
          priceAmount: 0,
          postTrialPriceAmount: 12,
          renewalDate: "2026-06-27",
          trialEndDate: "2026-06-29",
          cancelByDate: "2026-06-27",
        }),
        makeSubscription({
          id: "stale",
          priceAmount: 10,
          renewalDate: "2026-05-10",
        }),
      ],
      fromDate,
      60,
    );

    expect(ics).toContain("SUMMARY:Cancel-by deadline: trial");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260710");
    expect(ics).not.toContain("DTSTART;VALUE=DATE:20260510");
    expect(ics).not.toContain("DTSTART;VALUE=DATE:20260610");
  });

  test("excludes canceled subscriptions and past deadlines", () => {
    const ics = buildSubscriptionCalendar(
      [
        makeSubscription({
          id: "canceled",
          status: "Canceled",
          renewalDate: "2026-07-01",
        }),
        makeSubscription({
          id: "old-trial",
          status: "Trial",
          renewalDate: null,
          trialEndDate: "2026-05-01",
          cancelByDate: "2026-05-01",
        }),
      ],
      fromDate,
      60,
    );

    expect(ics).not.toContain("VEVENT");
  });
});

function makeSubscription(
  overrides: Partial<Subscription> & { id: string },
): Subscription {
  return {
    providerName: overrides.id,
    category: "Streaming",
    status: "Active",
    billingCadence: "Monthly",
    priceAmount: 10,
    currency: "USD",
    renewalDate: "2026-06-15",
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
    ...overrides,
  };
}
