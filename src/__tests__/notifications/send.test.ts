import { describe, expect, test } from "vitest";
import type { EmailMessage, EmailTransport } from "@/lib/email/provider";
import type { NotificationStore } from "@/lib/notifications/repository";
import { sendDueNotifications } from "@/lib/notifications/send";

const now = new Date("2026-06-12T09:00:00.000Z");

describe("send due notifications", () => {
  test("sends due email notifications and marks in-app ones delivered", async () => {
    const store = createFakeStore([
      makeRecord({ id: "due-email", channel: "Email", scheduledFor: "2026-06-12T08:00:00.000Z" }),
      makeRecord({ id: "due-inapp", channel: "InApp", scheduledFor: "2026-06-11T08:00:00.000Z" }),
      makeRecord({ id: "future", channel: "Email", scheduledFor: "2026-06-20T08:00:00.000Z" }),
      makeRecord({ id: "already-sent", channel: "Email", status: "Sent", scheduledFor: "2026-06-10T08:00:00.000Z" }),
    ]);
    const transport = createRecordingTransport();

    const result = await sendDueNotifications({
      userId: "user-1",
      recipientEmail: "demo@subhub.local",
      now,
      transport,
      store,
    });

    expect(result).toEqual({ processed: 2, sent: 2, failed: 0 });
    expect(transport.messages).toHaveLength(1);
    expect(transport.messages[0].to).toBe("demo@subhub.local");
    expect(statusOf(store, "due-email")).toBe("Sent");
    expect(statusOf(store, "due-inapp")).toBe("Sent");
    expect(statusOf(store, "future")).toBe("Scheduled");
  });

  test("marks notifications failed when the transport rejects them", async () => {
    const store = createFakeStore([
      makeRecord({ id: "due-email", channel: "Email", scheduledFor: "2026-06-12T08:00:00.000Z" }),
    ]);
    const transport: EmailTransport = {
      name: "broken",
      send: async () => ({ ok: false, error: "boom" }),
    };

    const result = await sendDueNotifications({
      userId: "user-1",
      recipientEmail: "demo@subhub.local",
      now,
      transport,
      store,
    });

    expect(result).toEqual({ processed: 1, sent: 0, failed: 1 });
    expect(statusOf(store, "due-email")).toBe("Failed");
  });

  test("is idempotent across repeat runs", async () => {
    const store = createFakeStore([
      makeRecord({ id: "due-email", channel: "Email", scheduledFor: "2026-06-12T08:00:00.000Z" }),
    ]);
    const transport = createRecordingTransport();

    await sendDueNotifications({
      userId: "user-1",
      recipientEmail: "demo@subhub.local",
      now,
      transport,
      store,
    });
    const second = await sendDueNotifications({
      userId: "user-1",
      recipientEmail: "demo@subhub.local",
      now,
      transport,
      store,
    });

    expect(second.processed).toBe(0);
    expect(transport.messages).toHaveLength(1);
  });
});

type FakeRecord = ReturnType<typeof makeRecord>;

function makeRecord(overrides: {
  id: string;
  channel: string;
  scheduledFor: string;
  status?: string;
}) {
  return {
    id: overrides.id,
    userId: "user-1",
    subscriptionId: "netflix",
    type: "RenewalReminder",
    channel: overrides.channel,
    status: overrides.status ?? "Scheduled",
    scheduledFor: new Date(overrides.scheduledFor),
    sentAt: null as Date | null,
    readAt: null as Date | null,
    dedupeKey: `key-${overrides.id}`,
    payloadTitle: "Netflix renews soon",
    payloadBody: "Netflix charges in 7 days.",
    payloadUrl: "/subscriptions/netflix",
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  };
}

function statusOf(
  store: NotificationStore & { records: FakeRecord[] },
  id: string,
): string {
  return store.records.find((record) => record.id === id)?.status ?? "missing";
}

function createRecordingTransport(): EmailTransport & {
  messages: EmailMessage[];
} {
  const messages: EmailMessage[] = [];

  return {
    name: "recording",
    messages,
    async send(message) {
      messages.push(message);
      return { ok: true };
    },
  };
}

function createFakeStore(initial: FakeRecord[]) {
  const records = [...initial];

  const store: NotificationStore & { records: FakeRecord[] } = {
    records,
    notification: {
      upsert: async ({ create }) => {
        records.push(create as FakeRecord);
        return create as FakeRecord;
      },
      findMany: async ({ where }) =>
        records
          .filter(
            (record) =>
              record.userId === where.userId &&
              (!where.status || record.status === where.status) &&
              (!where.scheduledFor ||
                record.scheduledFor.getTime() <=
                  where.scheduledFor.lte.getTime()),
          )
          .sort(
            (left, right) =>
              left.scheduledFor.getTime() - right.scheduledFor.getTime(),
          ),
      updateMany: async ({ where, data }) => {
        let count = 0;

        for (const record of records) {
          if (record.userId !== where.userId) {
            continue;
          }

          if (where.id && record.id !== where.id) {
            continue;
          }

          if (where.subscriptionId && record.subscriptionId !== where.subscriptionId) {
            continue;
          }

          if (where.status && record.status !== where.status) {
            continue;
          }

          if (
            where.scheduledFor?.gte &&
            record.scheduledFor.getTime() < where.scheduledFor.gte.getTime()
          ) {
            continue;
          }

          Object.assign(record, data);
          count += 1;
        }

        return { count };
      },
    },
  };

  return store;
}
