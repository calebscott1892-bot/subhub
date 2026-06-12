import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

export type PriceChange = {
  id: string;
  subscriptionId: string;
  oldPriceAmount: number;
  newPriceAmount: number;
  currency: string;
  changeDate: string;
  source: string;
};

type PriceChangeRecord = PriceChange & {
  userId: string;
  createdAt: Date;
};

export type PriceHistoryStore = {
  priceChange: {
    create(args: {
      data: Omit<PriceChangeRecord, "createdAt">;
    }): Promise<PriceChangeRecord>;
    findMany(args: {
      where: { userId: string; subscriptionId?: string };
      orderBy?: Array<Record<string, string>>;
    }): Promise<PriceChangeRecord[]>;
  };
};

export async function recordPriceChange(
  userId: string,
  change: Omit<PriceChange, "id">,
  store: PriceHistoryStore = prisma,
): Promise<void> {
  await store.priceChange.create({
    data: { id: randomUUID(), userId, ...change },
  });
}

export async function listPriceChanges(
  userId: string,
  subscriptionId?: string,
  store: PriceHistoryStore = prisma,
): Promise<PriceChange[]> {
  const records = await store.priceChange.findMany({
    where: subscriptionId ? { userId, subscriptionId } : { userId },
    orderBy: [{ changeDate: "desc" }],
  });

  return records.map((record) => ({
    id: record.id,
    subscriptionId: record.subscriptionId,
    oldPriceAmount: record.oldPriceAmount,
    newPriceAmount: record.newPriceAmount,
    currency: record.currency,
    changeDate: record.changeDate,
    source: record.source,
  }));
}
