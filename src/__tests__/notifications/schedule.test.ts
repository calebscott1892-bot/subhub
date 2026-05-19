import { describe, expect, test } from "vitest";
import { buildNotificationSchedules } from "@/lib/notifications/schedule";
import type { Subscription } from "@/lib/subscriptions/types";

describe("notification schedule builder", () => {
  test("schedules trial cancel-by reminders at 7 days, 2 days, and same day", () => {
    const schedules = buildNotificationSchedules({
      subscription: {
        ...makeSubscription("trial", "Trial"),
        trialEndDate: "2026-06-10",
        cancelByDate: "2026-06-08",
        postTrialPriceAmount: 12,
      },
      userId: "user-1",
      fromDate: "2026-05-19",
      timezone: "Australia/Perth",
    });

    expect(schedules.map((schedule) => [schedule.type, schedule.scheduledFor])).toEqual([
      ["CancelBySoon", "2026-06-01T01:00:00.000Z"],
      ["CancelBySoon", "2026-06-06T01:00:00.000Z"],
      ["CancelBySoon", "2026-06-08T01:00:00.000Z"],
    ]);
    expect(schedules[0].payload.title).toBe("Cancel trial soon");
    expect(schedules[0].dedupeKey).toBe(
      "trial:CancelBySoon:2026-06-01T01:00:00.000Z",
    );
  });

  test("falls back to trial end date when cancel-by date is missing", () => {
    const schedules = buildNotificationSchedules({
      subscription: {
        ...makeSubscription("trial", "Trial"),
        trialEndDate: "2026-05-29",
        cancelByDate: null,
      },
      userId: "user-1",
      fromDate: "2026-05-19",
      timezone: "Australia/Perth",
    });

    expect(schedules.map((schedule) => schedule.scheduledFor)).toEqual([
      "2026-05-22T01:00:00.000Z",
      "2026-05-27T01:00:00.000Z",
      "2026-05-29T01:00:00.000Z",
    ]);
  });

  test("schedules renewal reminders at 7 days and 1 day before renewal", () => {
    const schedules = buildNotificationSchedules({
      subscription: makeSubscription("active", "Active", "2026-06-10"),
      userId: "user-1",
      fromDate: "2026-05-19",
      timezone: "Australia/Perth",
    });

    expect(schedules.map((schedule) => [schedule.type, schedule.scheduledFor])).toEqual([
      ["RenewalSoon", "2026-06-03T01:00:00.000Z"],
      ["RenewalSoon", "2026-06-09T01:00:00.000Z"],
    ]);
  });

  test("does not schedule past reminders or renewal reminders for inactive subscriptions", () => {
    const expiredTrialSchedules = buildNotificationSchedules({
      subscription: {
        ...makeSubscription("trial", "Trial"),
        trialEndDate: "2026-05-20",
      },
      userId: "user-1",
      fromDate: "2026-05-19",
      timezone: "Australia/Perth",
    });

    const canceledSchedules = buildNotificationSchedules({
      subscription: makeSubscription("canceled", "Canceled", "2026-06-10"),
      userId: "user-1",
      fromDate: "2026-05-19",
      timezone: "Australia/Perth",
    });

    expect(expiredTrialSchedules).toHaveLength(1);
    expect(expiredTrialSchedules[0].scheduledFor).toBe("2026-05-20T01:00:00.000Z");
    expect(canceledSchedules).toEqual([]);
  });
});

function makeSubscription(
  id: string,
  status: Subscription["status"],
  renewalDate: string | null = "2026-06-01",
): Subscription {
  return {
    id,
    providerName: id,
    category: "Software",
    status,
    billingCadence: "Monthly",
    priceAmount: 10,
    currency: "USD",
    renewalDate,
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
  };
}
