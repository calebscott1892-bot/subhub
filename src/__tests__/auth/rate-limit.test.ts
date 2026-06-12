import { describe, expect, test } from "vitest";
import {
  clearLoginAttempts,
  isLoginRateLimited,
  MAX_LOGIN_ATTEMPTS,
  recordFailedLogin,
  type RateLimitStore,
} from "@/lib/auth/rate-limit";

const now = new Date("2026-06-12T09:00:00.000Z");

describe("login rate limiting", () => {
  test("locks an email after the maximum failed attempts in the window", async () => {
    const store = createFakeStore();

    for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS - 1; attempt += 1) {
      await recordFailedLogin("Demo@Subhub.local", store);
    }
    await expect(
      isLoginRateLimited("demo@subhub.local", now, store),
    ).resolves.toBe(false);

    await recordFailedLogin("demo@subhub.local", store);
    await expect(
      isLoginRateLimited("demo@subhub.local", now, store),
    ).resolves.toBe(true);
    await expect(
      isLoginRateLimited("other@subhub.local", now, store),
    ).resolves.toBe(false);
  });

  test("ignores attempts older than the window and clears on success", async () => {
    const store = createFakeStore();
    store.records.push(
      ...Array.from({ length: MAX_LOGIN_ATTEMPTS }, (_, index) => ({
        id: `old-${index}`,
        email: "demo@subhub.local",
        createdAt: new Date("2026-06-12T08:00:00.000Z"),
      })),
    );

    await expect(
      isLoginRateLimited("demo@subhub.local", now, store),
    ).resolves.toBe(false);

    for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS; attempt += 1) {
      await recordFailedLogin("demo@subhub.local", store);
    }
    await expect(
      isLoginRateLimited("demo@subhub.local", now, store),
    ).resolves.toBe(true);

    await clearLoginAttempts("demo@subhub.local", store);
    await expect(
      isLoginRateLimited("demo@subhub.local", now, store),
    ).resolves.toBe(false);
  });
});

type FakeAttempt = { id: string; email: string; createdAt: Date };

function createFakeStore(): RateLimitStore & { records: FakeAttempt[] } {
  const records: FakeAttempt[] = [];

  return {
    records,
    loginAttempt: {
      count: async ({ where }) =>
        records.filter(
          (record) =>
            record.email === where.email &&
            record.createdAt.getTime() >= where.createdAt.gte.getTime(),
        ).length,
      create: async ({ data }) => {
        records.push({ ...data, createdAt: now });
        return data;
      },
      deleteMany: async ({ where }) => {
        const before = records.length;
        for (let index = records.length - 1; index >= 0; index -= 1) {
          if (records[index].email === where.email) {
            records.splice(index, 1);
          }
        }
        return { count: before - records.length };
      },
    },
  };
}
