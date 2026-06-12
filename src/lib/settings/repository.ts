import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { ReminderPreferences } from "@/lib/notifications/schedule";

// Spec fallback when the user has not chosen a timezone.
export const DEFAULT_TIMEZONE = "Australia/Brisbane";

export const TIMEZONE_OPTIONS = [
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Sydney",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
] as const;

export type UserSettings = ReminderPreferences & {
  timezone: string;
  monthlyReview: boolean;
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const [user, reminders] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.reminderSettings.findUnique({ where: { userId } }),
  ]);

  return {
    timezone: user?.timezone ?? DEFAULT_TIMEZONE,
    trialReminders: reminders?.trialReminders ?? true,
    renewalReminders: reminders?.renewalReminders ?? true,
    monthlyReview: reminders?.monthlyReview ?? false,
  };
}

export async function saveProfile(
  userId: string,
  input: { displayName: string | null; timezone: string },
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { displayName: input.displayName, timezone: input.timezone },
  });
}

export async function saveReminderSettings(
  userId: string,
  input: ReminderPreferences & { monthlyReview: boolean },
): Promise<void> {
  await prisma.reminderSettings.upsert({
    where: { userId },
    update: input,
    create: { id: randomUUID(), userId, ...input },
  });
}

export async function exportUserData(userId: string): Promise<object> {
  const [
    user,
    subscriptions,
    notifications,
    budgetSettings,
    categoryBudgets,
    household,
    detectedCandidates,
    auditEvents,
    priceChanges,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.subscription.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
    prisma.budgetSettings.findUnique({ where: { userId } }),
    prisma.categoryBudget.findMany({ where: { userId } }),
    prisma.household.findUnique({ where: { ownerUserId: userId } }),
    prisma.detectedCandidate.findMany({ where: { userId } }),
    prisma.auditEvent.findMany({ where: { userId } }),
    prisma.priceChange.findMany({ where: { userId } }),
  ]);

  const householdMembers = household
    ? await prisma.householdMember.findMany({
        where: { householdId: household.id },
      })
    : [];
  const subscriptionShares = await prisma.subscriptionShare.findMany({
    where: {
      subscriptionId: { in: subscriptions.map((record) => record.id) },
    },
  });

  return {
    exportedAt: new Date().toISOString(),
    profile: user
      ? { email: user.email, displayName: user.displayName, timezone: user.timezone }
      : null,
    subscriptions,
    notifications,
    budget: { settings: budgetSettings, categoryBudgets },
    household: household
      ? { ...household, members: householdMembers, shares: subscriptionShares }
      : null,
    detectedCandidates,
    auditEvents,
    priceChanges,
  };
}

export async function deleteAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
  });
  const subscriptionIds = subscriptions.map((record) => record.id);
  const household = await prisma.household.findUnique({
    where: { ownerUserId: userId },
  });

  if (subscriptionIds.length > 0) {
    await prisma.subscriptionShare.deleteMany({
      where: { subscriptionId: { in: subscriptionIds } },
    });
  }

  if (household) {
    await prisma.householdMember.deleteMany({
      where: { householdId: household.id },
    });
    await prisma.household.delete({ where: { id: household.id } });
  }

  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.budgetSettings.deleteMany({ where: { userId } });
  await prisma.categoryBudget.deleteMany({ where: { userId } });
  await prisma.detectedCandidate.deleteMany({ where: { userId } });
  await prisma.auditEvent.deleteMany({ where: { userId } });
  await prisma.priceChange.deleteMany({ where: { userId } });
  await prisma.reminderSettings.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });

  if (user) {
    await prisma.loginAttempt.deleteMany({ where: { email: user.email } });
  }

  await prisma.user.delete({ where: { id: userId } });
}
