import { describe, expect, test } from "vitest";
import {
  getBudgetSettings,
  getCategoryTargets,
  saveBudgetTargets,
  type BudgetStore,
} from "@/lib/budget/repository";

describe("budget repository", () => {
  test("returns defaults when the user has no budget settings", async () => {
    const store = createFakeStore();

    await expect(getBudgetSettings("user-1", store)).resolves.toEqual({
      monthlyTarget: null,
      currency: "USD",
    });
    await expect(getCategoryTargets("user-1", store)).resolves.toEqual([]);
  });

  test("saves the overall target and category targets", async () => {
    const store = createFakeStore();

    await saveBudgetTargets(
      "user-1",
      {
        monthlyTarget: 150,
        categoryTargets: [
          { category: "Streaming", monthlyTarget: 40 },
          { category: "Software", monthlyTarget: 60 },
        ],
      },
      store,
    );

    await expect(getBudgetSettings("user-1", store)).resolves.toEqual({
      monthlyTarget: 150,
      currency: "USD",
    });
    await expect(getCategoryTargets("user-1", store)).resolves.toEqual([
      { category: "Software", monthlyTarget: 60 },
      { category: "Streaming", monthlyTarget: 40 },
    ]);
  });

  test("updates existing targets and clears categories set to empty or zero", async () => {
    const store = createFakeStore();

    await saveBudgetTargets(
      "user-1",
      {
        monthlyTarget: 150,
        categoryTargets: [
          { category: "Streaming", monthlyTarget: 40 },
          { category: "Software", monthlyTarget: 60 },
        ],
      },
      store,
    );
    await saveBudgetTargets(
      "user-1",
      {
        monthlyTarget: 200,
        categoryTargets: [
          { category: "Streaming", monthlyTarget: 55 },
          { category: "Software", monthlyTarget: null },
        ],
      },
      store,
    );

    await expect(getBudgetSettings("user-1", store)).resolves.toEqual({
      monthlyTarget: 200,
      currency: "USD",
    });
    await expect(getCategoryTargets("user-1", store)).resolves.toEqual([
      { category: "Streaming", monthlyTarget: 55 },
    ]);
  });

  test("keeps budgets scoped to their owner", async () => {
    const store = createFakeStore();

    await saveBudgetTargets(
      "user-1",
      {
        monthlyTarget: 150,
        categoryTargets: [{ category: "Streaming", monthlyTarget: 40 }],
      },
      store,
    );

    await expect(getBudgetSettings("user-2", store)).resolves.toEqual({
      monthlyTarget: null,
      currency: "USD",
    });
    await expect(getCategoryTargets("user-2", store)).resolves.toEqual([]);
  });
});

type SettingsRecord = {
  id: string;
  userId: string;
  monthlyTarget: number | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

type CategoryRecord = {
  id: string;
  userId: string;
  category: string;
  monthlyTarget: number;
  createdAt: Date;
  updatedAt: Date;
};

function createFakeStore(): BudgetStore {
  const now = new Date("2026-05-19T00:00:00.000Z");
  const settings: SettingsRecord[] = [];
  const categories: CategoryRecord[] = [];

  return {
    budgetSettings: {
      findUnique: async ({ where }) =>
        settings.find((record) => record.userId === where.userId) ?? null,
      upsert: async ({ where, update, create }) => {
        const existing = settings.find(
          (record) => record.userId === where.userId,
        );

        if (existing) {
          Object.assign(existing, update, { updatedAt: now });
          return existing;
        }

        const created = { ...create, createdAt: now, updatedAt: now };
        settings.push(created);
        return created;
      },
    },
    categoryBudget: {
      findMany: async ({ where }) =>
        categories
          .filter((record) => record.userId === where.userId)
          .sort((left, right) => left.category.localeCompare(right.category)),
      upsert: async ({ where, update, create }) => {
        const existing = categories.find(
          (record) =>
            record.userId === where.userId_category.userId &&
            record.category === where.userId_category.category,
        );

        if (existing) {
          Object.assign(existing, update, { updatedAt: now });
          return existing;
        }

        const created = { ...create, createdAt: now, updatedAt: now };
        categories.push(created);
        return created;
      },
      deleteMany: async ({ where }) => {
        const before = categories.length;

        for (let index = categories.length - 1; index >= 0; index -= 1) {
          const record = categories[index];
          const matchesCategory =
            !where.category || where.category.in.includes(record.category);

          if (record.userId === where.userId && matchesCategory) {
            categories.splice(index, 1);
          }
        }

        return { count: before - categories.length };
      },
    },
  };
}
