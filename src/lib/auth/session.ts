import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  generateSessionToken,
  hashSessionToken,
  isSessionActive,
  sessionExpiry,
} from "./tokens";

export const SESSION_COOKIE = "subhub_session";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = sessionExpiry(now);

  await prisma.session.create({
    data: {
      id: hashSessionToken(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: hashSessionToken(token) },
  });

  if (!session || !isSessionActive(session.expiresAt, new Date())) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  if (!user) {
    return null;
  }

  return { id: user.id, email: user.email, displayName: user.displayName };
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { id: hashSessionToken(token) },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function registerUser(input: {
  email: string;
  passwordHash: string;
  displayName: string | null;
}): Promise<AuthenticatedUser | null> {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return null;
  }

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      passwordHash: input.passwordHash,
      displayName: input.displayName,
    },
  });

  return { id: user.id, email: user.email, displayName: user.displayName };
}

export async function findUserForLogin(
  email: string,
): Promise<{ id: string; passwordHash: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  return user ? { id: user.id, passwordHash: user.passwordHash } : null;
}
