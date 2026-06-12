"use server";

import { redirect } from "next/navigation";
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/lib/auth/password";
import {
  createSession,
  destroySession,
  findUserForLogin,
  registerUser,
} from "@/lib/auth/session";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const user = await findUserForLogin(email);
  const passwordMatches = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim() || null;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    redirect("/signup?error=email");
  }

  if (validatePassword(password)) {
    redirect("/signup?error=password");
  }

  const user = await registerUser({
    email,
    passwordHash: await hashPassword(password),
    displayName,
  });

  if (!user) {
    redirect("/signup?error=exists");
  }

  await createSession(user.id);
  redirect("/onboarding");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
