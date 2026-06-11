import { describe, expect, test } from "vitest";
import {
  createSubscription,
  deleteSubscription,
  getSubscriptionById,
  listSubscriptions,
  updateSubscription,
} from "@/lib/subscriptions/repository";
import type { SubscriptionFormInput } from "@/lib/subscriptions/validation";

describe("subscription repository", () => {
  test("lists subscriptions for the requested owner in renewal order", async () => {
    const store = createFakeStore([
      makeRecord({ id: "owned-late", userId: "user-1", renewalDate: "2026-06-01" }),
      makeRecord({ id: "other", userId: "user-2", renewalDate: "2026-05-20" }),
      makeRecord({ id: "owned-soon", userId: "user-1", renewalDate: "2026-05-21" }),
    ]);

    const result = await listSubscriptions("user-1", store);

    expect(result.map((subscription) => subscription.id)).toEqual([
      "owned-soon",
      "owned-late",
    ]);
  });

  test("finds one subscription only when it belongs to the owner", async () => {
    const store = createFakeStore([
      makeRecord({ id: "owned", userId: "user-1" }),
      makeRecord({ id: "other", userId: "user-2" }),
    ]);

    await expect(getSubscriptionById("user-1", "owned", store)).resolves.toMatchObject({
      id: "owned",
    });
    await expect(getSubscriptionById("user-1", "other", store)).resolves.toBeNull();
  });

  test("creates a subscription with the owner attached", async () => {
    const store = createFakeStore([]);

    const created = await createSubscription("user-1", makeInput(), store);

    expect(created).toMatchObject({
      providerName: "Acme Streaming",
      priceAmount: 19.99,
    });
    expect("userId" in created).toBe(false);
    expect(store.records[0]).toMatchObject({
      userId: "user-1",
      providerName: "Acme Streaming",
    });
  });

  test("updates and deletes only owner-scoped records", async () => {
    const store = createFakeStore([
      makeRecord({ id: "owned", userId: "user-1", providerName: "Old" }),
      makeRecord({ id: "other", userId: "user-2", providerName: "Other" }),
    ]);

    await expect(
      updateSubscription("user-1", "owned", { ...makeInput(), providerName: "New" }, store),
    ).resolves.toMatchObject({ id: "owned", providerName: "New" });

    await expect(
      updateSubscription("user-1", "other", { ...makeInput(), providerName: "Bad" }, store),
    ).resolves.toBeNull();

    await expect(deleteSubscription("user-1", "other", store)).resolves.toBe(false);
    await expect(deleteSubscription("user-1", "owned", store)).resolves.toBe(true);
    expect(store.records.map((record) => record.id)).toEqual(["other"]);
  });
});

type FakeRecord = ReturnType<typeof makeRecord>;

function createFakeStore(initialRecords: FakeRecord[]) {
  const store = {
    records: [...initialRecords],
    subscription: {
      findMany: async ({ where }: { where: { userId: string } }) =>
        store.records
          .filter((record) => record.userId === where.userId)
          .sort((left, right) =>
            String(left.renewalDate).localeCompare(String(right.renewalDate)),
          ),
      findFirst: async ({
        where,
      }: {
        where: { id: string; userId: string };
      }) =>
        store.records.find(
          (record) => record.id === where.id && record.userId === where.userId,
        ) ?? null,
      create: async ({ data }: { data: FakeRecord }) => {
        store.records.push(data);
        return data;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; userId: string };
        data: Partial<FakeRecord>;
      }) => {
        let count = 0;
        store.records = store.records.map((record) => {
          if (record.id === where.id && record.userId === where.userId) {
            count += 1;
            return { ...record, ...data, updatedAt: new Date("2026-05-20T00:00:00.000Z") };
          }

          return record;
        });
        return { count };
      },
      deleteMany: async ({ where }: { where: { id: string; userId: string } }) => {
        const before = store.records.length;
        store.records = store.records.filter(
          (record) => !(record.id === where.id && record.userId === where.userId),
        );
        return { count: before - store.records.length };
      },
    },
  };

  return store;
}

function makeInput(): SubscriptionFormInput {
  return {
    providerName: "Acme Streaming",
    category: "Streaming",
    status: "Active",
    billingCadence: "Monthly",
    intervalDays: null,
    priceAmount: 19.99,
    currency: "USD",
    startDate: null,
    renewalDate: "2026-06-01",
    trialStartDate: null,
    trialEndDate: null,
    cancelByDate: null,
    postTrialPriceAmount: null,
    accountEmailForProvider: null,
    loginUrl: null,
    billingUrl: null,
    cancelUrl: null,
    supportUrl: null,
    paymentMethodLabel: null,
    notes: null,
    lastUsageDate: null,
  };
}

function makeRecord(overrides: Partial<{
  id: string;
  userId: string;
  providerName: string;
  renewalDate: string | null;
}> = {}) {
  return {
    id: overrides.id ?? "record",
    userId: overrides.userId ?? "user-1",
    providerName: overrides.providerName ?? "Acme",
    category: "Software",
    status: "Active",
    billingCadence: "Monthly",
    intervalDays: null,
    priceAmount: 10,
    currency: "USD",
    startDate: null,
    renewalDate: overrides.renewalDate ?? "2026-06-01",
    trialStartDate: null,
    trialEndDate: null,
    cancelByDate: null,
    postTrialPriceAmount: null,
    accountEmailForProvider: null,
    loginUrl: null,
    billingUrl: null,
    cancelUrl: null,
    supportUrl: null,
    paymentMethodLabel: null,
    notes: null,
    lastUsageDate: null,
    isShared: false,
    splitType: null,
    createdAt: new Date("2026-05-19T00:00:00.000Z"),
    updatedAt: new Date("2026-05-19T00:00:00.000Z"),
  };
}
