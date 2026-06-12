import { describe, expect, test } from "vitest";
import {
  diffSubscription,
  summarizeSubscriptionUpdate,
} from "@/lib/audit/changes";
import { findRecentPriceIncreases } from "@/lib/insights/price-increases";
import { buildSupportEmailDraft } from "@/lib/subscriptions/support-email";
import type { Subscription } from "@/lib/subscriptions/types";

describe("subscription change diff", () => {
  test("narrates price, status, and renewal changes", () => {
    const before = makeSubscription({ id: "netflix" });
    const after = {
      ...before,
      priceAmount: 25.99,
      status: "Paused" as const,
      renewalDate: "2026-07-01",
    };

    const changes = diffSubscription(before, after);
    const fields = changes.map((change) => change.field);

    expect(fields).toEqual(["status", "priceAmount", "renewalDate"]);
    expect(changes.find((c) => c.field === "priceAmount")?.summary).toContain(
      "$22.99",
    );
    expect(changes.find((c) => c.field === "priceAmount")?.summary).toContain(
      "$25.99",
    );
  });

  test("returns no changes for identical subscriptions", () => {
    const subscription = makeSubscription({ id: "netflix" });

    expect(diffSubscription(subscription, { ...subscription })).toEqual([]);
    expect(summarizeSubscriptionUpdate(subscription, [])).toContain(
      "details updated",
    );
  });
});

describe("price increase insight", () => {
  test("keeps only recent increases, newest first", () => {
    const increases = findRecentPriceIncreases(
      [
        change("c-up-recent", 10, 12, "2026-06-01"),
        change("c-down", 20, 15, "2026-06-05"),
        change("c-up-old", 10, 14, "2025-12-01"),
      ],
      "2026-06-12",
    );

    expect(increases).toHaveLength(1);
    expect(increases[0]).toMatchObject({
      increaseAmount: 2,
      increasePercent: 20,
    });
  });
});

describe("support email draft", () => {
  test("includes provider, account email, and a mailto link", () => {
    const draft = buildSupportEmailDraft(
      makeSubscription({
        id: "netflix",
        providerName: "Netflix Premium",
        accountEmailForProvider: "alex@example.com",
      }),
    );

    expect(draft.subject).toBe("Cancel my Netflix Premium subscription");
    expect(draft.body).toContain("alex@example.com");
    expect(draft.mailtoHref).toContain("mailto:?subject=");
  });
});

function change(
  id: string,
  oldPrice: number,
  newPrice: number,
  changeDate: string,
) {
  return {
    id,
    subscriptionId: `sub-${id}`,
    oldPriceAmount: oldPrice,
    newPriceAmount: newPrice,
    currency: "USD",
    changeDate,
    source: "manual-edit",
  };
}

function makeSubscription(
  overrides: Partial<Subscription> & { id: string },
): Subscription {
  return {
    providerName: overrides.id,
    category: "Streaming",
    status: "Active",
    billingCadence: "Monthly",
    priceAmount: 22.99,
    currency: "USD",
    renewalDate: "2026-06-28",
    createdAt: "2026-05-19T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
    ...overrides,
  };
}
