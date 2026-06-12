import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { Subscription } from "./types";
import type { SubscriptionFormInput } from "./validation";

type SubscriptionRecord = {
  id: string;
  userId: string;
  providerName: string;
  category: string;
  status: string;
  billingCadence: string;
  intervalDays: number | null;
  priceAmount: number;
  currency: string;
  startDate: string | null;
  renewalDate: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  cancelByDate: string | null;
  postTrialPriceAmount: number | null;
  accountEmailForProvider: string | null;
  loginUrl: string | null;
  billingUrl: string | null;
  cancelUrl: string | null;
  supportUrl: string | null;
  paymentMethodLabel: string | null;
  notes: string | null;
  lastUsageDate: string | null;
  isShared: boolean;
  splitType: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SubscriptionStore = {
  subscription: {
    findMany(args: {
      where: { userId: string };
      orderBy?: Array<Record<string, string>>;
    }): Promise<SubscriptionRecord[]>;
    findFirst(args: {
      where: { id: string; userId: string };
    }): Promise<SubscriptionRecord | null>;
    create(args: { data: SubscriptionRecord }): Promise<SubscriptionRecord>;
    updateMany(args: {
      where: { id: string; userId: string };
      data: Partial<SubscriptionRecord>;
    }): Promise<{ count: number }>;
    deleteMany(args: {
      where: { id: string; userId: string };
    }): Promise<{ count: number }>;
  };
};

export async function listSubscriptions(
  userId: string,
  store: SubscriptionStore = prisma,
): Promise<Subscription[]> {
  const records = await store.subscription.findMany({
    where: { userId },
    orderBy: [{ renewalDate: "asc" }, { providerName: "asc" }],
  });

  return records.map(mapSubscriptionRecord);
}

export async function getSubscriptionById(
  userId: string,
  id: string,
  store: SubscriptionStore = prisma,
): Promise<Subscription | null> {
  const record = await store.subscription.findFirst({
    where: { id, userId },
  });

  return record ? mapSubscriptionRecord(record) : null;
}

export async function createSubscription(
  userId: string,
  input: SubscriptionFormInput,
  store: SubscriptionStore = prisma,
): Promise<Subscription> {
  const now = new Date();
  const record = await store.subscription.create({
    data: {
      id: randomUUID(),
      userId,
      isShared: false,
      splitType: null,
      createdAt: now,
      updatedAt: now,
      ...input,
    },
  });

  return mapSubscriptionRecord(record);
}

export async function updateSubscription(
  userId: string,
  id: string,
  input: SubscriptionFormInput,
  store: SubscriptionStore = prisma,
): Promise<Subscription | null> {
  const updateResult = await store.subscription.updateMany({
    where: { id, userId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });

  if (updateResult.count === 0) {
    return null;
  }

  return getSubscriptionById(userId, id, store);
}

export async function deleteSubscription(
  userId: string,
  id: string,
  store: SubscriptionStore = prisma,
): Promise<boolean> {
  const deleteResult = await store.subscription.deleteMany({
    where: { id, userId },
  });

  return deleteResult.count > 0;
}

function mapSubscriptionRecord(record: SubscriptionRecord): Subscription {
  return {
    id: record.id,
    providerName: record.providerName,
    category: record.category as Subscription["category"],
    status: record.status as Subscription["status"],
    billingCadence: record.billingCadence as Subscription["billingCadence"],
    intervalDays: record.intervalDays,
    priceAmount: record.priceAmount,
    currency: record.currency,
    startDate: record.startDate,
    renewalDate: record.renewalDate,
    trialStartDate: record.trialStartDate,
    trialEndDate: record.trialEndDate,
    cancelByDate: record.cancelByDate,
    postTrialPriceAmount: record.postTrialPriceAmount,
    accountEmailForProvider: record.accountEmailForProvider,
    loginUrl: record.loginUrl,
    billingUrl: record.billingUrl,
    cancelUrl: record.cancelUrl,
    supportUrl: record.supportUrl,
    paymentMethodLabel: record.paymentMethodLabel,
    notes: record.notes,
    lastUsageDate: record.lastUsageDate,
    isShared: record.isShared,
    splitType: record.splitType as Subscription["splitType"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
