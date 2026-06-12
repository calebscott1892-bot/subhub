import { describe, expect, test } from "vitest";
import { buildNotificationSchedules } from "@/lib/notifications/schedule";
import type { Subscription } from "@/lib/subscriptions/types";

const base = {
  userId: "user-1",
  fromDate: "2026-06-12",
  timezone: "Australia/Brisbane",
};

describe("reminder preferences", () => {
  test("disabling renewal reminders skips renewal schedules only", () => {
    const active = makeSubscription({
      id: "netflix",
      status: "Active",
      renewalDate: "2026-06-28",
    });

    const withDefaults = buildNotificationSchedules({
      ...base,
      subscription: active,
    });
    const withoutRenewals = buildNotificationSchedules({
      ...base,
      subscription: active,
      preferences: { trialReminders: true, renewalReminders: false },
    });

    expect(withDefaults.length).toBeGreaterThan(0);
    expect(withoutRenewals).toHaveLength(0);
  });

  test("disabling trial reminders skips cancel-by schedules", () => {
    const trial = makeSubscription({
      id: "notion",
      status: "Trial",
      renewalDate: null,
      trialEndDate: "2026-06-29",
      cancelByDate: "2026-06-27",
    });

    const withDefaults = buildNotificationSchedules({
      ...base,
      subscription: trial,
    });
    const withoutTrials = buildNotificationSchedules({
      ...base,
      subscription: trial,
      preferences: { trialReminders: false, renewalReminders: true },
    });

    expect(withDefaults.length).toBeGreaterThan(0);
    expect(withoutTrials).toHaveLength(0);
  });
});

function makeSubscription(
  overrides: Partial<Subscription> & { id: string },
): Subscription {
  return {
    providerName: overrides.id,
    category: "Software",
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
