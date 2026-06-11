import { describe, expect, test } from "vitest";
import {
  addHouseholdMember,
  getOrCreateHousehold,
  getSharesForSubscriptions,
  listHouseholdMembers,
  removeHouseholdMember,
  setSubscriptionSharing,
  type HouseholdStore,
} from "@/lib/household/repository";

describe("household repository", () => {
  test("creates the household once and reuses it", async () => {
    const store = createFakeStore();

    const first = await getOrCreateHousehold("user-1", store);
    const second = await getOrCreateHousehold("user-1", store);

    expect(first.id).toBe(second.id);
    expect(store.households).toHaveLength(1);
    expect(store.households[0]).toMatchObject({
      ownerUserId: "user-1",
      name: "My household",
    });
  });

  test("adds members as invited when an email is recorded, active otherwise", async () => {
    const store = createFakeStore();

    const invited = await addHouseholdMember(
      "user-1",
      { name: "Jordan", email: "jordan@example.com", role: "Adult" },
      store,
    );
    const tracked = await addHouseholdMember(
      "user-1",
      { name: "Sam", email: null, role: "Member" },
      store,
    );

    expect(invited.status).toBe("Invited");
    expect(tracked.status).toBe("Active");
    await expect(listHouseholdMembers("user-1", store)).resolves.toHaveLength(2);
    await expect(listHouseholdMembers("user-2", store)).resolves.toHaveLength(0);
  });

  test("removing a member also removes their subscription shares", async () => {
    const store = createFakeStore();
    const member = await addHouseholdMember(
      "user-1",
      { name: "Jordan", email: null, role: "Adult" },
      store,
    );
    store.subscriptions.push({ id: "netflix", userId: "user-1" });
    await setSubscriptionSharing(
      "user-1",
      "netflix",
      { splitType: "Equal", shares: [{ memberId: member.id }] },
      store,
    );

    expect(store.shares).toHaveLength(1);

    const removed = await removeHouseholdMember("user-1", member.id, store);

    expect(removed).toBe(true);
    expect(store.shares).toHaveLength(0);
    await expect(
      removeHouseholdMember("user-2", member.id, store),
    ).resolves.toBe(false);
  });

  test("sets, replaces, and clears subscription sharing for owned subscriptions", async () => {
    const store = createFakeStore();
    const jordan = await addHouseholdMember(
      "user-1",
      { name: "Jordan", email: null, role: "Adult" },
      store,
    );
    const sam = await addHouseholdMember(
      "user-1",
      { name: "Sam", email: null, role: "Member" },
      store,
    );
    store.subscriptions.push({ id: "netflix", userId: "user-1" });

    await setSubscriptionSharing(
      "user-1",
      "netflix",
      { splitType: "Equal", shares: [{ memberId: jordan.id }] },
      store,
    );
    expect(store.subscriptions[0]).toMatchObject({
      isShared: true,
      splitType: "Equal",
    });

    await setSubscriptionSharing(
      "user-1",
      "netflix",
      {
        splitType: "Percentage",
        shares: [{ memberId: sam.id, percentage: 40 }],
      },
      store,
    );
    const shares = await getSharesForSubscriptions(["netflix"], store);
    expect(shares.get("netflix")).toEqual([
      { memberId: sam.id, fixedAmount: null, percentage: 40 },
    ]);

    await setSubscriptionSharing(
      "user-1",
      "netflix",
      { splitType: null, shares: [] },
      store,
    );
    expect(store.subscriptions[0]).toMatchObject({
      isShared: false,
      splitType: null,
    });
    expect(store.shares).toHaveLength(0);
  });

  test("rejects sharing for foreign subscriptions and foreign members", async () => {
    const store = createFakeStore();
    const stranger = await addHouseholdMember(
      "user-2",
      { name: "Stranger", email: null, role: "Member" },
      store,
    );
    store.subscriptions.push({ id: "netflix", userId: "user-1" });

    await expect(
      setSubscriptionSharing(
        "user-2",
        "netflix",
        { splitType: "Equal", shares: [{ memberId: stranger.id }] },
        store,
      ),
    ).resolves.toBe(false);

    await expect(
      setSubscriptionSharing(
        "user-1",
        "netflix",
        { splitType: "Equal", shares: [{ memberId: stranger.id }] },
        store,
      ),
    ).rejects.toThrowError(/members of your household/);
  });
});

type FakeHousehold = {
  id: string;
  ownerUserId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type FakeMember = {
  id: string;
  householdId: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type FakeShare = {
  id: string;
  subscriptionId: string;
  memberId: string;
  fixedAmount: number | null;
  percentage: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type FakeSubscription = {
  id: string;
  userId: string;
  isShared?: boolean;
  splitType?: string | null;
};

function createFakeStore() {
  const now = new Date("2026-05-19T00:00:00.000Z");
  const households: FakeHousehold[] = [];
  const members: FakeMember[] = [];
  const shares: FakeShare[] = [];
  const subscriptions: FakeSubscription[] = [];

  const store: HouseholdStore & {
    households: FakeHousehold[];
    members: FakeMember[];
    shares: FakeShare[];
    subscriptions: FakeSubscription[];
  } = {
    households,
    members,
    shares,
    subscriptions,
    household: {
      findUnique: async ({ where }) =>
        households.find(
          (household) => household.ownerUserId === where.ownerUserId,
        ) ?? null,
      create: async ({ data }) => {
        const record = { ...data, createdAt: now, updatedAt: now };
        households.push(record);
        return record;
      },
    },
    householdMember: {
      findMany: async ({ where }) =>
        members.filter((member) => member.householdId === where.householdId),
      create: async ({ data }) => {
        const record = { ...data, createdAt: now, updatedAt: now };
        members.push(record);
        return record;
      },
      deleteMany: async ({ where }) => {
        const before = members.length;
        for (let index = members.length - 1; index >= 0; index -= 1) {
          if (
            members[index].id === where.id &&
            members[index].householdId === where.householdId
          ) {
            members.splice(index, 1);
          }
        }
        return { count: before - members.length };
      },
    },
    subscriptionShare: {
      findMany: async ({ where }) =>
        shares.filter((share) =>
          where.subscriptionId.in.includes(share.subscriptionId),
        ),
      create: async ({ data }) => {
        const record = { ...data, createdAt: now, updatedAt: now };
        shares.push(record);
        return record;
      },
      deleteMany: async ({ where }) => {
        const before = shares.length;
        for (let index = shares.length - 1; index >= 0; index -= 1) {
          const share = shares[index];
          const matches =
            "subscriptionId" in where
              ? share.subscriptionId === where.subscriptionId
              : share.memberId === where.memberId;
          if (matches) {
            shares.splice(index, 1);
          }
        }
        return { count: before - shares.length };
      },
    },
    subscription: {
      findFirst: async ({ where }) =>
        subscriptions.find(
          (subscription) =>
            subscription.id === where.id && subscription.userId === where.userId,
        ) ?? null,
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const subscription of subscriptions) {
          if (
            subscription.id === where.id &&
            subscription.userId === where.userId
          ) {
            subscription.isShared = data.isShared;
            subscription.splitType = data.splitType;
            count += 1;
          }
        }
        return { count };
      },
    },
  };

  return store;
}
