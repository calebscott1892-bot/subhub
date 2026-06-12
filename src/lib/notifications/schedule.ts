import type { Subscription } from "@/lib/subscriptions/types";

export type NotificationType =
  | "CancelBySoon"
  | "RenewalSoon"
  | "BudgetExceeded"
  | "BudgetApproaching"
  | "MonthlyReview"
  | "AccountMaintenance";
export type NotificationChannel = "InApp" | "Email";

export type NotificationSchedule = {
  userId: string;
  subscriptionId: string;
  type: NotificationType;
  channel: NotificationChannel;
  scheduledFor: string;
  dedupeKey: string;
  payload: {
    title: string;
    body: string;
    url: string;
  };
};

export type ReminderPreferences = {
  trialReminders: boolean;
  renewalReminders: boolean;
};

type BuildNotificationSchedulesInput = {
  subscription: Subscription;
  userId: string;
  fromDate: string;
  timezone: string;
  reminderHour?: number;
  preferences?: ReminderPreferences;
};

const TRIAL_LEAD_DAYS = [7, 2, 0];
const RENEWAL_LEAD_DAYS = [7, 1];
const ACTIVE_RENEWAL_STATUSES = new Set<Subscription["status"]>([
  "Active",
  "Paused",
]);

export function buildNotificationSchedules({
  subscription,
  userId,
  fromDate,
  timezone,
  reminderHour = 9,
  preferences = { trialReminders: true, renewalReminders: true },
}: BuildNotificationSchedulesInput): NotificationSchedule[] {
  const schedules: NotificationSchedule[] = [];

  if (subscription.status === "Trial" && preferences.trialReminders) {
    const trialDeadline = subscription.cancelByDate || subscription.trialEndDate;

    if (trialDeadline) {
      schedules.push(
        ...TRIAL_LEAD_DAYS.flatMap((leadDays) =>
          buildScheduleForLeadDay({
            subscription,
            userId,
            fromDate,
            timezone,
            reminderHour,
            eventDate: trialDeadline,
            leadDays,
            type: "CancelBySoon",
          }),
        ),
      );
    }
  }

  const renewalDate = subscription.renewalDate;

  if (
    renewalDate &&
    preferences.renewalReminders &&
    ACTIVE_RENEWAL_STATUSES.has(subscription.status)
  ) {
    schedules.push(
      ...RENEWAL_LEAD_DAYS.flatMap((leadDays) =>
        buildScheduleForLeadDay({
          subscription,
          userId,
          fromDate,
          timezone,
          reminderHour,
          eventDate: renewalDate,
          leadDays,
          type: "RenewalSoon",
        }),
      ),
    );
  }

  return schedules.sort((left, right) =>
    left.scheduledFor.localeCompare(right.scheduledFor),
  );
}

function buildScheduleForLeadDay({
  subscription,
  userId,
  fromDate,
  timezone,
  reminderHour,
  eventDate,
  leadDays,
  type,
}: {
  subscription: Subscription;
  userId: string;
  fromDate: string;
  timezone: string;
  reminderHour: number;
  eventDate: string;
  leadDays: number;
  type: NotificationType;
}): NotificationSchedule[] {
  const scheduleDate = addDays(eventDate, -leadDays);

  if (!scheduleDate || compareDateOnly(scheduleDate, fromDate) < 0) {
    return [];
  }

  const scheduledFor = zonedDateTimeToUtcIso(
    scheduleDate,
    reminderHour,
    timezone,
  );
  const dedupeKey = `${subscription.id}:${type}:${scheduledFor}`;

  return [
    {
      userId,
      subscriptionId: subscription.id,
      type,
      channel: "InApp",
      scheduledFor,
      dedupeKey,
      payload: buildPayload(subscription, type, eventDate, leadDays),
    },
  ];
}

function buildPayload(
  subscription: Subscription,
  type: NotificationType,
  eventDate: string,
  leadDays: number,
) {
  if (type === "CancelBySoon") {
    return {
      title: "Cancel trial soon",
      body:
        leadDays === 0
          ? `${subscription.providerName} should be reviewed today before the trial converts.`
          : `${subscription.providerName} should be reviewed in ${leadDays} days before the trial converts.`,
      url: `/subscriptions/${subscription.id}`,
    };
  }

  return {
    title: "Renewal upcoming",
    body:
      leadDays === 1
        ? `${subscription.providerName} renews tomorrow on ${eventDate}.`
        : `${subscription.providerName} renews in ${leadDays} days on ${eventDate}.`,
    url: `/subscriptions/${subscription.id}`,
  };
}

function addDays(dateOnly: string, days: number): string | null {
  const date = parseDateOnly(dateOnly);

  if (!date) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function compareDateOnly(left: string, right: string): number {
  return left.localeCompare(right);
}

function parseDateOnly(dateOnly: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

// Public wrapper so other schedule builders (e.g. maintenance reminders) can
// compute a local-morning send time without duplicating timezone math.
export function reminderTimeUtcIso(
  dateOnly: string,
  timezone: string,
  hour = 9,
): string {
  return zonedDateTimeToUtcIso(dateOnly, hour, timezone);
}

function zonedDateTimeToUtcIso(
  dateOnly: string,
  hour: number,
  timezone: string,
): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour));
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timezone);
  return new Date(utcGuess.getTime() - offsetMinutes * 60_000).toISOString();
}

function getTimeZoneOffsetMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  const localAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second,
  );

  return (localAsUtc - date.getTime()) / 60_000;
}
