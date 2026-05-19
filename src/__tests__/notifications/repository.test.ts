import { describe, expect, test } from "vitest";
import {
  cancelFutureNotificationsForSubscription,
  listNotifications,
  upsertNotificationSchedules,
} from "@/lib/notifications/repository";
import type { NotificationSchedule } from "@/lib/notifications/schedule";

describe("notification repository", () => {
  test("upserts schedules by dedupe key", async () => {
    const store = createFakeNotificationStore([]);
    const schedule = makeSchedule("dedupe-1", "2026-06-01T01:00:00.000Z");

    await upsertNotificationSchedules([schedule], store);
    await upsertNotificationSchedules(
      [
        {
          ...schedule,
          payload: {
            ...schedule.payload,
            body: "Updated reminder body",
          },
        },
      ],
      store,
    );

    expect(store.records).toHaveLength(1);
    expect(store.records[0].payloadBody).toBe("Updated reminder body");
  });

  test("lists notifications for an owner in scheduled order", async () => {
    const store = createFakeNotificationStore([
      makeRecord("late", "user-1", "2026-06-10T01:00:00.000Z"),
      makeRecord("other", "user-2", "2026-05-20T01:00:00.000Z"),
      makeRecord("soon", "user-1", "2026-05-22T01:00:00.000Z"),
    ]);

    const notifications = await listNotifications("user-1", store);

    expect(notifications.map((notification) => notification.id)).toEqual([
      "soon",
      "late",
    ]);
  });

  test("cancels future scheduled notifications for one subscription", async () => {
    const store = createFakeNotificationStore([
      makeRecord("past", "user-1", "2026-05-18T01:00:00.000Z", "sub-1"),
      makeRecord("future", "user-1", "2026-05-22T01:00:00.000Z", "sub-1"),
      makeRecord("sent", "user-1", "2026-05-23T01:00:00.000Z", "sub-1", "Sent"),
      makeRecord("other", "user-1", "2026-05-22T01:00:00.000Z", "sub-2"),
    ]);

    const count = await cancelFutureNotificationsForSubscription(
      "user-1",
      "sub-1",
      new Date("2026-05-19T00:00:00.000Z"),
      store,
    );

    expect(count).toBe(1);
    expect(store.records.find((record) => record.id === "future")?.status).toBe(
      "Canceled",
    );
    expect(store.records.find((record) => record.id === "past")?.status).toBe(
      "Scheduled",
    );
    expect(store.records.find((record) => record.id === "sent")?.status).toBe(
      "Sent",
    );
  });
});

type FakeRecord = ReturnType<typeof makeRecord>;

function createFakeNotificationStore(initialRecords: FakeRecord[]) {
  const store = {
    records: [...initialRecords],
    notification: {
      upsert: async ({
        where,
        update,
        create,
      }: {
        where: { dedupeKey: string };
        update: Partial<FakeRecord>;
        create: FakeRecord;
      }) => {
        const index = store.records.findIndex(
          (record) => record.dedupeKey === where.dedupeKey,
        );

        if (index === -1) {
          store.records.push(create);
          return create;
        }

        store.records[index] = { ...store.records[index], ...update };
        return store.records[index];
      },
      findMany: async ({ where }: { where: { userId: string } }) =>
        store.records
          .filter((record) => record.userId === where.userId)
          .sort((left, right) =>
            left.scheduledFor.getTime() - right.scheduledFor.getTime(),
          ),
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          userId: string;
          subscriptionId: string;
          status: string;
          scheduledFor: { gte: Date };
        };
        data: Partial<FakeRecord>;
      }) => {
        let count = 0;
        store.records = store.records.map((record) => {
          if (
            record.userId === where.userId &&
            record.subscriptionId === where.subscriptionId &&
            record.status === where.status &&
            record.scheduledFor >= where.scheduledFor.gte
          ) {
            count += 1;
            return { ...record, ...data };
          }

          return record;
        });

        return { count };
      },
    },
  };

  return store;
}

function makeSchedule(
  dedupeKey: string,
  scheduledFor: string,
): NotificationSchedule {
  return {
    userId: "user-1",
    subscriptionId: "sub-1",
    type: "CancelBySoon",
    channel: "InApp",
    scheduledFor,
    dedupeKey,
    payload: {
      title: "Cancel trial soon",
      body: "Reminder body",
      url: "/subscriptions/sub-1",
    },
  };
}

function makeRecord(
  id: string,
  userId: string,
  scheduledFor: string,
  subscriptionId = "sub-1",
  status = "Scheduled",
) {
  return {
    id,
    userId,
    subscriptionId,
    type: "CancelBySoon",
    channel: "InApp",
    status,
    scheduledFor: new Date(scheduledFor),
    sentAt: null,
    readAt: null,
    dedupeKey: id,
    payloadTitle: "Cancel trial soon",
    payloadBody: "Reminder body",
    payloadUrl: "/subscriptions/sub-1",
    createdAt: new Date("2026-05-19T00:00:00.000Z"),
    updatedAt: new Date("2026-05-19T00:00:00.000Z"),
  };
}
