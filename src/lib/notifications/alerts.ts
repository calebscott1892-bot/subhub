import type { BudgetOverview } from "@/lib/budget/calculate-budget";
import { formatCurrency } from "@/lib/format";
import type { NotificationSchedule } from "./schedule";

// Workspace-level notifications are not tied to a subscription row; these
// sentinel ids keep the required column meaningful and collision-free.
export const BUDGET_ALERT_ENTITY = "budget";
export const REVIEW_REMINDER_ENTITY = "monthly-review";

export function buildBudgetAlertSchedules(options: {
  userId: string;
  overview: BudgetOverview;
  currency: string;
  monthKey: string;
  nowIso: string;
}): NotificationSchedule[] {
  const { userId, overview, currency, monthKey, nowIso } = options;

  if (overview.status !== "over" && overview.status !== "approaching") {
    return [];
  }

  const overCategories = overview.categories
    .filter((category) => category.status === "over")
    .map((category) => category.category);
  const categorySuffix =
    overCategories.length > 0
      ? ` Over in: ${overCategories.join(", ")}.`
      : "";

  if (overview.status === "over") {
    return [
      {
        userId,
        subscriptionId: BUDGET_ALERT_ENTITY,
        type: "BudgetExceeded",
        channel: "InApp",
        scheduledFor: nowIso,
        dedupeKey: `budget:over:${userId}:${monthKey}`,
        payload: {
          title: "Budget exceeded",
          body: `Monthly spend ${formatCurrency(overview.monthlySpend, currency)} is over your ${formatCurrency(
            overview.monthlyTarget ?? 0,
            currency,
          )} target.${categorySuffix}`,
          url: "/budget",
        },
      },
    ];
  }

  return [
    {
      userId,
      subscriptionId: BUDGET_ALERT_ENTITY,
      type: "BudgetApproaching",
      channel: "InApp",
      scheduledFor: nowIso,
      dedupeKey: `budget:approaching:${userId}:${monthKey}`,
      payload: {
        title: "Budget approaching its limit",
        body: `Monthly spend ${formatCurrency(overview.monthlySpend, currency)} is ${Math.round(
          (overview.utilization ?? 0) * 100,
        )}% of your ${formatCurrency(overview.monthlyTarget ?? 0, currency)} target.${categorySuffix}`,
        url: "/budget",
      },
    },
  ];
}

export function buildMonthlyReviewSchedule(options: {
  userId: string;
  enabled: boolean;
  monthKey: string;
  nowIso: string;
}): NotificationSchedule[] {
  if (!options.enabled) {
    return [];
  }

  return [
    {
      userId: options.userId,
      subscriptionId: REVIEW_REMINDER_ENTITY,
      type: "MonthlyReview",
      channel: "InApp",
      scheduledFor: options.nowIso,
      dedupeKey: `review:${options.userId}:${options.monthKey}`,
      payload: {
        title: "Monthly subscription review",
        body: "Take five minutes to scan your subscriptions: anything unused, duplicated, or about to renew that you no longer want?",
        url: "/subscriptions",
      },
    },
  ];
}

export function buildMaintenanceReminderSchedule(options: {
  userId: string;
  subscriptionId: string;
  providerName: string;
  kind: "account-email" | "password";
  date: string;
  scheduledForIso: string;
}): NotificationSchedule {
  const action =
    options.kind === "password"
      ? `rotate the password for ${options.providerName}`
      : `review the account email on ${options.providerName}`;

  return {
    userId: options.userId,
    subscriptionId: options.subscriptionId,
    type: "AccountMaintenance",
    channel: "InApp",
    scheduledFor: options.scheduledForIso,
    dedupeKey: `maintenance:${options.subscriptionId}:${options.kind}:${options.date}`,
    payload: {
      title: "Account maintenance reminder",
      body: `Time to ${action}. Subscription Hub never stores provider passwords - this is just your nudge.`,
      url: `/subscriptions/${options.subscriptionId}`,
    },
  };
}

// Quiet hours wrap midnight when start > end (e.g. 22 -> 7).
export function isWithinQuietHours(
  now: Date,
  timezone: string,
  startHour: number | null,
  endHour: number | null,
): boolean {
  if (startHour === null || endHour === null || startHour === endHour) {
    return false;
  }

  const localHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(now),
  );

  if (startHour < endHour) {
    return localHour >= startHour && localHour < endHour;
  }

  return localHour >= startHour || localHour < endHour;
}
