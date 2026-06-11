import {
  calculateMonthlyCost,
  isCountedInSpend,
  roundCurrency,
} from "@/lib/subscriptions/costs";
import type { Subscription } from "@/lib/subscriptions/types";

export const APPROACHING_THRESHOLD = 0.85;

export type BudgetStatus = "no-target" | "on-track" | "approaching" | "over";

export type CategoryTarget = {
  category: string;
  monthlyTarget: number;
};

export type TargetProgress = {
  utilization: number | null;
  remaining: number | null;
  status: BudgetStatus;
};

export type CategoryBudgetProgress = TargetProgress & {
  category: string;
  monthlySpend: number;
  monthlyTarget: number | null;
};

export type BudgetOverview = TargetProgress & {
  monthlySpend: number;
  monthlyTarget: number | null;
  categories: CategoryBudgetProgress[];
};

export function calculateBudgetOverview(
  subscriptions: Subscription[],
  monthlyTarget: number | null,
  categoryTargets: CategoryTarget[],
): BudgetOverview {
  const spendByCategory = new Map<string, number>();
  let monthlySpend = 0;

  for (const subscription of subscriptions) {
    if (!isCountedInSpend(subscription.status)) {
      continue;
    }

    const cost = calculateMonthlyCost(subscription);
    monthlySpend = roundCurrency(monthlySpend + cost);
    spendByCategory.set(
      subscription.category,
      roundCurrency((spendByCategory.get(subscription.category) ?? 0) + cost),
    );
  }

  const targetByCategory = new Map(
    categoryTargets.map((target) => [target.category, target.monthlyTarget]),
  );
  const categoryNames = new Set([
    ...spendByCategory.keys(),
    ...targetByCategory.keys(),
  ]);

  const categories = [...categoryNames]
    .map((category) => {
      const spend = spendByCategory.get(category) ?? 0;
      const target = targetByCategory.get(category) ?? null;

      return {
        category,
        monthlySpend: spend,
        monthlyTarget: target,
        ...progressAgainstTarget(spend, target),
      };
    })
    .sort(
      (left, right) =>
        right.monthlySpend - left.monthlySpend ||
        left.category.localeCompare(right.category),
    );

  return {
    monthlySpend,
    monthlyTarget,
    ...progressAgainstTarget(monthlySpend, monthlyTarget),
    categories,
  };
}

export function progressAgainstTarget(
  spend: number,
  target: number | null,
): TargetProgress {
  if (target === null || target <= 0) {
    return { utilization: null, remaining: null, status: "no-target" };
  }

  const utilization = spend / target;

  return {
    utilization,
    remaining: roundCurrency(target - spend),
    status:
      spend > target
        ? "over"
        : utilization >= APPROACHING_THRESHOLD
          ? "approaching"
          : "on-track",
  };
}
