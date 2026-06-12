import { daysUntil } from "@/lib/subscriptions/dates";
import type { PriceChange } from "@/lib/subscriptions/price-history";

export const PRICE_INCREASE_WINDOW_DAYS = 90;

export type PriceIncreaseInsight = {
  priceChange: PriceChange;
  increaseAmount: number;
  increasePercent: number;
};

export function findRecentPriceIncreases(
  priceChanges: PriceChange[],
  fromDate: string,
  windowDays = PRICE_INCREASE_WINDOW_DAYS,
): PriceIncreaseInsight[] {
  return priceChanges
    .filter((change) => {
      if (change.newPriceAmount <= change.oldPriceAmount) {
        return false;
      }

      const age = -daysUntil(change.changeDate, fromDate);
      return Number.isFinite(age) && age >= 0 && age <= windowDays;
    })
    .map((change) => ({
      priceChange: change,
      increaseAmount:
        Math.round((change.newPriceAmount - change.oldPriceAmount) * 100) / 100,
      increasePercent: Math.round(
        ((change.newPriceAmount - change.oldPriceAmount) /
          change.oldPriceAmount) *
          100,
      ),
    }))
    .sort(
      (left, right) =>
        right.priceChange.changeDate.localeCompare(
          left.priceChange.changeDate,
        ) || right.increaseAmount - left.increaseAmount,
    );
}
