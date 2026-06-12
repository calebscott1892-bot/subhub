import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MINUTES = 15;

export type RateLimitStore = {
  loginAttempt: {
    count(args: {
      where: { email: string; createdAt: { gte: Date } };
    }): Promise<number>;
    create(args: { data: { id: string; email: string } }): Promise<unknown>;
    deleteMany(args: { where: { email: string } }): Promise<{ count: number }>;
  };
};

export async function isLoginRateLimited(
  email: string,
  now: Date,
  store: RateLimitStore = prisma,
): Promise<boolean> {
  const attempts = await store.loginAttempt.count({
    where: {
      email: email.toLowerCase(),
      createdAt: { gte: windowStart(now) },
    },
  });

  return attempts >= MAX_LOGIN_ATTEMPTS;
}

export async function recordFailedLogin(
  email: string,
  store: RateLimitStore = prisma,
): Promise<void> {
  await store.loginAttempt.create({
    data: { id: randomUUID(), email: email.toLowerCase() },
  });
}

export async function clearLoginAttempts(
  email: string,
  store: RateLimitStore = prisma,
): Promise<void> {
  await store.loginAttempt.deleteMany({
    where: { email: email.toLowerCase() },
  });
}

function windowStart(now: Date): Date {
  return new Date(now.getTime() - LOGIN_WINDOW_MINUTES * 60_000);
}
