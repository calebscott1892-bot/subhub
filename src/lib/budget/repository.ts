import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { CategoryTarget } from "./calculate-budget";

export const DEFAULT_BUDGET_CURRENCY = "USD";

type BudgetSettingsRecord = {
  id: string;
  userId: string;
  monthlyTarget: number | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

type CategoryBudgetRecord = {
  id: string;
  userId: string;
  category: string;
  monthlyTarget: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BudgetStore = {
  budgetSettings: {
    findUnique(args: {
      where: { userId: string };
    }): Promise<BudgetSettingsRecord | null>;
    upsert(args: {
      where: { userId: string };
      update: { monthlyTarget: number | null; currency: string };
      create: {
        id: string;
        userId: string;
        monthlyTarget: number | null;
        currency: string;
      };
    }): Promise<BudgetSettingsRecord>;
  };
  categoryBudget: {
    findMany(args: {
      where: { userId: string };
      orderBy?: Array<Record<string, string>>;
    }): Promise<CategoryBudgetRecord[]>;
    upsert(args: {
      where: { userId_category: { userId: string; category: string } };
      update: { monthlyTarget: number };
      create: {
        id: string;
        userId: string;
        category: string;
        monthlyTarget: number;
      };
    }): Promise<CategoryBudgetRecord>;
    deleteMany(args: {
      where: { userId: string; category?: { in: string[] } };
    }): Promise<{ count: number }>;
  };
};

export type BudgetSettings = {
  monthlyTarget: number | null;
  currency: string;
};

export async function getBudgetSettings(
  userId: string,
  store: BudgetStore = prisma,
): Promise<BudgetSettings> {
  const record = await store.budgetSettings.findUnique({ where: { userId } });

  return {
    monthlyTarget: record?.monthlyTarget ?? null,
    currency: record?.currency ?? DEFAULT_BUDGET_CURRENCY,
  };
}

export async function getCategoryTargets(
  userId: string,
  store: BudgetStore = prisma,
): Promise<CategoryTarget[]> {
  const records = await store.categoryBudget.findMany({
    where: { userId },
    orderBy: [{ category: "asc" }],
  });

  return records.map((record) => ({
    category: record.category,
    monthlyTarget: record.monthlyTarget,
  }));
}

export type SaveBudgetTargetsInput = {
  monthlyTarget: number | null;
  currency?: string;
  categoryTargets: Array<{ category: string; monthlyTarget: number | null }>;
};

export async function saveBudgetTargets(
  userId: string,
  input: SaveBudgetTargetsInput,
  store: BudgetStore = prisma,
): Promise<void> {
  const currency = input.currency ?? DEFAULT_BUDGET_CURRENCY;

  await store.budgetSettings.upsert({
    where: { userId },
    update: { monthlyTarget: input.monthlyTarget, currency },
    create: {
      id: randomUUID(),
      userId,
      monthlyTarget: input.monthlyTarget,
      currency,
    },
  });

  const clearedCategories = input.categoryTargets
    .filter((target) => target.monthlyTarget === null || target.monthlyTarget <= 0)
    .map((target) => target.category);

  if (clearedCategories.length > 0) {
    await store.categoryBudget.deleteMany({
      where: { userId, category: { in: clearedCategories } },
    });
  }

  for (const target of input.categoryTargets) {
    if (target.monthlyTarget === null || target.monthlyTarget <= 0) {
      continue;
    }

    await store.categoryBudget.upsert({
      where: {
        userId_category: { userId, category: target.category },
      },
      update: { monthlyTarget: target.monthlyTarget },
      create: {
        id: randomUUID(),
        userId,
        category: target.category,
        monthlyTarget: target.monthlyTarget,
      },
    });
  }
}
