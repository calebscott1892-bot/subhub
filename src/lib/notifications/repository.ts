import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { NotificationSchedule } from "./schedule";

export type NotificationStatus = "Scheduled" | "Sent" | "Failed" | "Canceled";

export type Notification = {
  id: string;
  userId: string;
  subscriptionId: string;
  type: string;
  channel: string;
  status: NotificationStatus;
  scheduledFor: string;
  sentAt: string | null;
  readAt: string | null;
  dedupeKey: string;
  payload: {
    title: string;
    body: string;
    url: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

type NotificationRecord = {
  id: string;
  userId: string;
  subscriptionId: string;
  type: string;
  channel: string;
  status: string;
  scheduledFor: Date;
  sentAt: Date | null;
  readAt: Date | null;
  dedupeKey: string;
  payloadTitle: string;
  payloadBody: string;
  payloadUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NotificationStore = {
  notification: {
    upsert(args: {
      where: { dedupeKey: string };
      update: Partial<NotificationRecord>;
      create: NotificationRecord;
    }): Promise<NotificationRecord>;
    findMany(args: {
      where: {
        userId: string;
        status?: string;
        scheduledFor?: { lte: Date };
      };
      orderBy?: Array<Record<string, string>>;
    }): Promise<NotificationRecord[]>;
    updateMany(args: {
      where: {
        id?: string;
        userId: string;
        subscriptionId?: string;
        status?: string;
        scheduledFor?: { gte: Date };
        readAt?: null;
      };
      data: Partial<NotificationRecord>;
    }): Promise<{ count: number }>;
  };
};

export async function upsertNotificationSchedules(
  schedules: NotificationSchedule[],
  store: NotificationStore = prisma,
): Promise<Notification[]> {
  const now = new Date();
  const records = await Promise.all(
    schedules.map((schedule) =>
      store.notification.upsert({
        where: { dedupeKey: schedule.dedupeKey },
        update: {
          type: schedule.type,
          channel: schedule.channel,
          status: "Scheduled",
          scheduledFor: new Date(schedule.scheduledFor),
          payloadTitle: schedule.payload.title,
          payloadBody: schedule.payload.body,
          payloadUrl: schedule.payload.url,
          updatedAt: now,
        },
        create: {
          id: randomUUID(),
          userId: schedule.userId,
          subscriptionId: schedule.subscriptionId,
          type: schedule.type,
          channel: schedule.channel,
          status: "Scheduled",
          scheduledFor: new Date(schedule.scheduledFor),
          sentAt: null,
          readAt: null,
          dedupeKey: schedule.dedupeKey,
          payloadTitle: schedule.payload.title,
          payloadBody: schedule.payload.body,
          payloadUrl: schedule.payload.url,
          createdAt: now,
          updatedAt: now,
        },
      }),
    ),
  );

  return records.map(mapNotificationRecord);
}

export async function listNotifications(
  userId: string,
  store: NotificationStore = prisma,
): Promise<Notification[]> {
  const records = await store.notification.findMany({
    where: { userId },
    orderBy: [{ scheduledFor: "asc" }],
  });

  return records.map(mapNotificationRecord);
}

export async function listDueNotifications(
  userId: string,
  now: Date,
  store: NotificationStore = prisma,
): Promise<Notification[]> {
  const records = await store.notification.findMany({
    where: {
      userId,
      status: "Scheduled",
      scheduledFor: { lte: now },
    },
    orderBy: [{ scheduledFor: "asc" }],
  });

  return records.map(mapNotificationRecord);
}

export async function markNotificationOutcome(
  userId: string,
  id: string,
  outcome: "Sent" | "Failed",
  at: Date,
  store: NotificationStore = prisma,
): Promise<boolean> {
  const result = await store.notification.updateMany({
    where: { id, userId },
    data: {
      status: outcome,
      sentAt: outcome === "Sent" ? at : null,
      updatedAt: at,
    },
  });

  return result.count > 0;
}

export async function markNotificationRead(
  userId: string,
  id: string,
  at: Date,
  store: NotificationStore = prisma,
): Promise<boolean> {
  const result = await store.notification.updateMany({
    where: { id, userId },
    data: { readAt: at, updatedAt: at },
  });

  return result.count > 0;
}

export async function markAllNotificationsRead(
  userId: string,
  at: Date,
  store: NotificationStore = prisma,
): Promise<number> {
  const result = await store.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: at, updatedAt: at },
  });

  return result.count;
}

export async function cancelFutureNotificationsForSubscription(
  userId: string,
  subscriptionId: string,
  fromDate: Date,
  store: NotificationStore = prisma,
): Promise<number> {
  const result = await store.notification.updateMany({
    where: {
      userId,
      subscriptionId,
      status: "Scheduled",
      scheduledFor: {
        gte: fromDate,
      },
    },
    data: {
      status: "Canceled",
      updatedAt: new Date(),
    },
  });

  return result.count;
}

function mapNotificationRecord(record: NotificationRecord): Notification {
  return {
    id: record.id,
    userId: record.userId,
    subscriptionId: record.subscriptionId,
    type: record.type,
    channel: record.channel,
    status: record.status as NotificationStatus,
    scheduledFor: record.scheduledFor.toISOString(),
    sentAt: record.sentAt?.toISOString() ?? null,
    readAt: record.readAt?.toISOString() ?? null,
    dedupeKey: record.dedupeKey,
    payload: {
      title: record.payloadTitle,
      body: record.payloadBody,
      url: record.payloadUrl,
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
