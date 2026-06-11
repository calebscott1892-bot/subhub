import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { ShareAllocation } from "@/lib/sharing/split-rules";
import type { SplitType } from "@/lib/subscriptions/types";
import type { HouseholdRole } from "./permissions";

type HouseholdRecord = {
  id: string;
  ownerUserId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type HouseholdMemberRecord = {
  id: string;
  householdId: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type SubscriptionShareRecord = {
  id: string;
  subscriptionId: string;
  memberId: string;
  fixedAmount: number | null;
  percentage: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type HouseholdStore = {
  household: {
    findUnique(args: {
      where: { ownerUserId: string };
    }): Promise<HouseholdRecord | null>;
    create(args: {
      data: { id: string; ownerUserId: string; name: string };
    }): Promise<HouseholdRecord>;
  };
  householdMember: {
    findMany(args: {
      where: { householdId: string };
      orderBy?: Array<Record<string, string>>;
    }): Promise<HouseholdMemberRecord[]>;
    create(args: {
      data: {
        id: string;
        householdId: string;
        name: string;
        email: string | null;
        role: string;
        status: string;
      };
    }): Promise<HouseholdMemberRecord>;
    deleteMany(args: {
      where: { id: string; householdId: string };
    }): Promise<{ count: number }>;
  };
  subscriptionShare: {
    findMany(args: {
      where: { subscriptionId: { in: string[] } };
    }): Promise<SubscriptionShareRecord[]>;
    create(args: {
      data: {
        id: string;
        subscriptionId: string;
        memberId: string;
        fixedAmount: number | null;
        percentage: number | null;
      };
    }): Promise<SubscriptionShareRecord>;
    deleteMany(args: {
      where: { subscriptionId: string } | { memberId: string };
    }): Promise<{ count: number }>;
  };
  subscription: {
    findFirst(args: {
      where: { id: string; userId: string };
    }): Promise<{ id: string } | null>;
    updateMany(args: {
      where: { id: string; userId: string };
      data: { isShared: boolean; splitType: string | null; updatedAt: Date };
    }): Promise<{ count: number }>;
  };
};

export type Household = {
  id: string;
  name: string;
};

export type HouseholdMember = {
  id: string;
  name: string;
  email: string | null;
  role: HouseholdRole;
  status: "Active" | "Invited";
};

export type NewHouseholdMember = {
  name: string;
  email: string | null;
  role: HouseholdRole;
};

export async function getOrCreateHousehold(
  userId: string,
  store: HouseholdStore = prisma,
): Promise<Household> {
  const existing = await store.household.findUnique({
    where: { ownerUserId: userId },
  });

  if (existing) {
    return { id: existing.id, name: existing.name };
  }

  const created = await store.household.create({
    data: { id: randomUUID(), ownerUserId: userId, name: "My household" },
  });

  return { id: created.id, name: created.name };
}

export async function listHouseholdMembers(
  userId: string,
  store: HouseholdStore = prisma,
): Promise<HouseholdMember[]> {
  const household = await getOrCreateHousehold(userId, store);
  const records = await store.householdMember.findMany({
    where: { householdId: household.id },
    orderBy: [{ createdAt: "asc" }],
  });

  return records.map(mapMemberRecord);
}

export async function addHouseholdMember(
  userId: string,
  input: NewHouseholdMember,
  store: HouseholdStore = prisma,
): Promise<HouseholdMember> {
  const household = await getOrCreateHousehold(userId, store);
  const record = await store.householdMember.create({
    data: {
      id: randomUUID(),
      householdId: household.id,
      name: input.name,
      email: input.email,
      role: input.role,
      // An email means an invitation is on record; without one the person is
      // simply tracked locally and active right away.
      status: input.email ? "Invited" : "Active",
    },
  });

  return mapMemberRecord(record);
}

export async function removeHouseholdMember(
  userId: string,
  memberId: string,
  store: HouseholdStore = prisma,
): Promise<boolean> {
  const household = await getOrCreateHousehold(userId, store);
  const deleted = await store.householdMember.deleteMany({
    where: { id: memberId, householdId: household.id },
  });

  if (deleted.count === 0) {
    return false;
  }

  await store.subscriptionShare.deleteMany({ where: { memberId } });
  return true;
}

export async function getSharesForSubscriptions(
  subscriptionIds: string[],
  store: HouseholdStore = prisma,
): Promise<Map<string, ShareAllocation[]>> {
  if (subscriptionIds.length === 0) {
    return new Map();
  }

  const records = await store.subscriptionShare.findMany({
    where: { subscriptionId: { in: subscriptionIds } },
  });
  const shares = new Map<string, ShareAllocation[]>();

  for (const record of records) {
    const list = shares.get(record.subscriptionId) ?? [];
    list.push({
      memberId: record.memberId,
      fixedAmount: record.fixedAmount,
      percentage: record.percentage,
    });
    shares.set(record.subscriptionId, list);
  }

  return shares;
}

export type SubscriptionSharingInput = {
  splitType: SplitType | null;
  shares: ShareAllocation[];
};

export async function setSubscriptionSharing(
  userId: string,
  subscriptionId: string,
  input: SubscriptionSharingInput,
  store: HouseholdStore = prisma,
): Promise<boolean> {
  const owned = await store.subscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!owned) {
    return false;
  }

  const members = await listHouseholdMembers(userId, store);
  const memberIds = new Set(members.map((member) => member.id));

  if (input.shares.some((share) => !memberIds.has(share.memberId))) {
    throw new Error("Shares can only include members of your household.");
  }

  const isShared = input.splitType !== null && input.shares.length > 0;

  await store.subscription.updateMany({
    where: { id: subscriptionId, userId },
    data: {
      isShared,
      splitType: isShared ? input.splitType : null,
      updatedAt: new Date(),
    },
  });
  await store.subscriptionShare.deleteMany({ where: { subscriptionId } });

  if (isShared) {
    for (const share of input.shares) {
      await store.subscriptionShare.create({
        data: {
          id: randomUUID(),
          subscriptionId,
          memberId: share.memberId,
          fixedAmount: share.fixedAmount ?? null,
          percentage: share.percentage ?? null,
        },
      });
    }
  }

  return true;
}

function mapMemberRecord(record: HouseholdMemberRecord): HouseholdMember {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role as HouseholdRole,
    status: record.status as HouseholdMember["status"],
  };
}
