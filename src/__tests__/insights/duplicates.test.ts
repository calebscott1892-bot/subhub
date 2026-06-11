import { describe, expect, test } from "vitest";
import { findDuplicateSubscriptions } from "@/lib/insights/duplicates";
import type { Subscription } from "@/lib/subscriptions/types";

describe("duplicate subscription insight", () => {
  test("groups subscriptions with the same normalized provider name", () => {
    const groups = findDuplicateSubscriptions([
      makeSubscription({ id: "a", providerName: "Dropbox Plus", priceAmount: 12 }),
      makeSubscription({ id: "b", providerName: "dropbox-plus", priceAmount: 10 }),
      makeSubscription({ id: "c", providerName: "Figma" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      kind: "provider",
      label: "Dropbox Plus",
      combinedMonthlyCost: 22,
    });
    expect(groups[0].subscriptions.map((subscription) => subscription.id)).toEqual([
      "a",
      "b",
    ]);
  });

  test("flags overlap-prone categories with multiple active services", () => {
    const groups = findDuplicateSubscriptions([
      makeSubscription({
        id: "netflix",
        providerName: "Netflix",
        category: "Streaming",
        priceAmount: 23,
      }),
      makeSubscription({
        id: "hulu",
        providerName: "Hulu",
        category: "Streaming",
        priceAmount: 18,
      }),
      makeSubscription({
        id: "vscode",
        providerName: "Editor Pro",
        category: "Software",
      }),
      makeSubscription({
        id: "intellij",
        providerName: "Other IDE",
        category: "Software",
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      kind: "category",
      label: "Streaming",
      combinedMonthlyCost: 41,
    });
  });

  test("does not report the same pair as both provider and category duplicates", () => {
    const groups = findDuplicateSubscriptions([
      makeSubscription({
        id: "one",
        providerName: "Netflix",
        category: "Streaming",
      }),
      makeSubscription({
        id: "two",
        providerName: "Netflix",
        category: "Streaming",
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].kind).toBe("provider");
  });

  test("ignores canceled and expired subscriptions", () => {
    const groups = findDuplicateSubscriptions([
      makeSubscription({
        id: "active",
        providerName: "Netflix",
        category: "Streaming",
      }),
      makeSubscription({
        id: "old",
        providerName: "Netflix",
        category: "Streaming",
        status: "Canceled",
      }),
    ]);

    expect(groups).toHaveLength(0);
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
