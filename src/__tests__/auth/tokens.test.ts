import { describe, expect, test } from "vitest";
import {
  generateSessionToken,
  hashSessionToken,
  isSessionActive,
  sessionExpiry,
  SESSION_TTL_DAYS,
} from "@/lib/auth/tokens";

describe("session tokens", () => {
  test("generates unique high-entropy tokens", () => {
    const first = generateSessionToken();
    const second = generateSessionToken();

    expect(first).toHaveLength(64);
    expect(first).not.toBe(second);
  });

  test("hashes tokens deterministically and irreversibly", () => {
    const token = generateSessionToken();

    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toContain(token);
    expect(hashSessionToken(token)).toHaveLength(64);
  });

  test("sessions expire after the configured TTL", () => {
    const createdAt = new Date("2026-06-12T00:00:00.000Z");
    const expiresAt = sessionExpiry(createdAt);
    const justBefore = new Date(
      createdAt.getTime() + (SESSION_TTL_DAYS * 24 * 60 * 60 * 1000 - 1000),
    );
    const justAfter = new Date(
      createdAt.getTime() + (SESSION_TTL_DAYS * 24 * 60 * 60 * 1000 + 1000),
    );

    expect(isSessionActive(expiresAt, justBefore)).toBe(true);
    expect(isSessionActive(expiresAt, justAfter)).toBe(false);
  });
});
