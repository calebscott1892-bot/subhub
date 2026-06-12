import { createHash, randomBytes } from "node:crypto";

export const SESSION_TTL_DAYS = 30;

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Only the hash is stored, so a leaked database cannot impersonate sessions.
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(from: Date): Date {
  return new Date(from.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function isSessionActive(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() > now.getTime();
}
