import { describe, expect, test } from "vitest";
import {
  filterAndSortSubscriptions,
  parseListQuery,
} from "@/lib/subscriptions/filtering";
import type { Subscription } from "@/lib/subscriptions/types";

const subscriptions: Subscription[] = [
  makeSubscription({
    id: "netflix",
    providerName: "Netflix Premium",
    category: "Streaming",
    priceAmount: 22.99,
    renewalDate: "2026-06-28",
    isShared: true,
    notes: "Shared with household",
    updatedAt: "2026-06-01T00:00:00.000Z",
  }),
  makeSubscription({
    id: "adobe",
    providerName: "Adobe Creative Cloud",
    category: "Software",
    billingCadence: "Yearly",
    priceAmount: 659.88,
    renewalDate: "2026-09-15",
    accountEmailForProvider: "design@example.com",
    updatedAt: "2026-06-10T00:00:00.000Z",
  }),
  makeSubscription({
    id: "paused-gym",
    providerName: "Local Gym",
    category: "Health",
    status: "Paused",
    priceAmount: 14.5,
    billingCadence: "Weekly",
    renewalDate: null,
    updatedAt: "2026-05-01T00:00:00.000Z",
  }),
];

describe("subscription list filtering", () => {
  test("searches across name, email, and notes", () => {
    expect(ids({ q: "netflix" })).toEqual(["netflix"]);
    expect(ids({ q: "design@example.com" })).toEqual(["adobe"]);
    expect(ids({ q: "household" })).toEqual(["netflix"]);
  });

  test("filters by status, category, cadence, and sharing", () => {
    expect(ids({ status: "Paused" })).toEqual(["paused-gym"]);
    expect(ids({ category: "Software" })).toEqual(["adobe"]);
    expect(ids({ cadence: "Weekly" })).toEqual(["paused-gym"]);
    expect(ids({ sharing: "shared" })).toEqual(["netflix"]);
    expect(ids({ sharing: "personal" })).toEqual(["adobe", "paused-gym"]);
  });

  test("sorts by renewal with undated last, price descending, and updated", () => {
    expect(ids({})).toEqual(["netflix", "adobe", "paused-gym"]);
    expect(ids({ sort: "price" })).toEqual(["paused-gym", "adobe", "netflix"]);
    expect(ids({ sort: "updated" })).toEqual(["adobe", "netflix", "paused-gym"]);
    expect(ids({ sort: "name" })).toEqual(["adobe", "paused-gym", "netflix"]);
  });

  test("ignores unknown sort and sharing values", () => {
    const query = parseListQuery({ sort: "bogus", sharing: "everyone" });

    expect(query.sort).toBe("renewal");
    expect(query.sharing).toBe("");
  });
});

function ids(params: Record<string, string>): string[] {
  return filterAndSortSubscriptions(
    subscriptions,
    parseListQuery(params),
  ).map((subscription) => subscription.id);
}

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
