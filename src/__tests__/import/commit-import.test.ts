import { describe, expect, test } from "vitest";
import {
  buildCsvImportPreview,
  commitCsvImport,
} from "@/lib/import/commit-import";
import type { Subscription } from "@/lib/subscriptions/types";
import type { SubscriptionFormInput } from "@/lib/subscriptions/validation";

describe("CSV import preview and commit", () => {
  test("adds duplicate warnings against existing subscriptions", () => {
    const preview = buildCsvImportPreview({
      csvText: [
        "providerName,category,status,billingCadence,priceAmount,currency,accountEmail",
        "Netflix,Streaming,Active,Monthly,22.99,USD,home@example.com",
      ].join("\n"),
      existingSubscriptions: [
        makeSubscription({
          providerName: "netflix",
          accountEmailForProvider: "home@example.com",
        }),
      ],
    });

    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0].warnings).toEqual([
      "Possible duplicate of existing subscription: netflix.",
    ]);
    expect(preview.validCount).toBe(1);
    expect(preview.invalidCount).toBe(0);
  });

  test("commits only valid rows through the provided create function", async () => {
    const created: SubscriptionFormInput[] = [];

    const result = await commitCsvImport({
      csvText: [
        "providerName,category,status,billingCadence,priceAmount,currency,renewalDate",
        "Spotify,Music,Active,Monthly,12.99,USD,2026-06-10",
        ",Software,Active,Monthly,6.99,USD,2026-06-11",
      ].join("\n"),
      existingSubscriptions: [],
      createSubscription: async (input) => {
        created.push(input);
        return makeSubscription({ providerName: input.providerName });
      },
    });

    expect(created.map((input) => input.providerName)).toEqual(["Spotify"]);
    expect(result.createdCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.errors).toEqual(["Row 3: Provider name is required."]);
  });
});

function makeSubscription(
  overrides: Partial<Subscription> = {},
): Subscription {
  return {
    id: overrides.id ?? "sub-1",
    providerName: overrides.providerName ?? "Netflix",
    category: overrides.category ?? "Streaming",
    status: overrides.status ?? "Active",
    billingCadence: overrides.billingCadence ?? "Monthly",
    intervalDays: overrides.intervalDays ?? null,
    priceAmount: overrides.priceAmount ?? 22.99,
    currency: overrides.currency ?? "USD",
    startDate: overrides.startDate ?? null,
    renewalDate: overrides.renewalDate ?? "2026-06-01",
    trialStartDate: overrides.trialStartDate ?? null,
    trialEndDate: overrides.trialEndDate ?? null,
    cancelByDate: overrides.cancelByDate ?? null,
    postTrialPriceAmount: overrides.postTrialPriceAmount ?? null,
    accountEmailForProvider: overrides.accountEmailForProvider ?? null,
    loginUrl: overrides.loginUrl ?? null,
    billingUrl: overrides.billingUrl ?? null,
    cancelUrl: overrides.cancelUrl ?? null,
    supportUrl: overrides.supportUrl ?? null,
    paymentMethodLabel: overrides.paymentMethodLabel ?? null,
    notes: overrides.notes ?? null,
    lastUsageDate: overrides.lastUsageDate ?? null,
    createdAt: overrides.createdAt ?? "2026-05-19T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-19T00:00:00.000Z",
  };
}
