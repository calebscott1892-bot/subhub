import { calculateBudgetOverview } from "@/lib/budget/calculate-budget";
import {
  getBudgetSettings,
  getCategoryTargets,
} from "@/lib/budget/repository";
import { getSharesForSubscriptions } from "@/lib/household/repository";
import { personalMonthlyCost } from "@/lib/sharing/personal-cost";
import { getUserSettings } from "@/lib/settings/repository";
import { listSubscriptions } from "@/lib/subscriptions/repository";
import {
  buildBudgetAlertSchedules,
  buildMonthlyReviewSchedule,
} from "./alerts";
import { upsertNotificationSchedules } from "./repository";

// Creates this month's workspace-level notifications (budget alerts and the
// monthly review prompt). Dedupe keys are month-scoped, so re-running is safe.
export async function ensureGeneratedNotifications(
  userId: string,
  now: Date,
): Promise<void> {
  const settings = await getUserSettings(userId);
  const subscriptions = await listSubscriptions(userId);
  const budgetSettings = await getBudgetSettings(userId);
  const categoryTargets = await getCategoryTargets(userId);
  const shares = await getSharesForSubscriptions(
    subscriptions.map((subscription) => subscription.id),
  );
  const overview = calculateBudgetOverview(
    subscriptions,
    budgetSettings.monthlyTarget,
    categoryTargets,
    (subscription) =>
      personalMonthlyCost(subscription, shares.get(subscription.id) ?? []),
  );

  const nowIso = now.toISOString();
  const monthKey = nowIso.slice(0, 7);
  const schedules = [
    ...buildBudgetAlertSchedules({
      userId,
      overview,
      currency: budgetSettings.currency,
      monthKey,
      nowIso,
    }),
    ...buildMonthlyReviewSchedule({
      userId,
      enabled: settings.monthlyReview,
      monthKey,
      nowIso,
    }),
  ];

  if (schedules.length > 0) {
    await upsertNotificationSchedules(schedules);
  }
}
