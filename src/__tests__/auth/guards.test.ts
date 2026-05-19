import { describe, expect, test } from "vitest";
import { canAccessAppRoute, getLoginRedirect } from "@/lib/auth/guards";

describe("auth route guards", () => {
  test("allows authenticated users to access app routes", () => {
    expect(canAccessAppRoute({ userId: "user_1" }, "/dashboard")).toBe(true);
    expect(canAccessAppRoute({ userId: "user_1" }, "/subscriptions")).toBe(true);
  });

  test("blocks anonymous users from app routes", () => {
    expect(canAccessAppRoute(null, "/dashboard")).toBe(false);
    expect(canAccessAppRoute(undefined, "/subscriptions/new")).toBe(false);
  });

  test("keeps return path when redirecting anonymous users to login", () => {
    expect(getLoginRedirect("/subscriptions/new")).toBe("/login?next=%2Fsubscriptions%2Fnew");
    expect(getLoginRedirect("/dashboard?range=30")).toBe("/login?next=%2Fdashboard%3Frange%3D30");
  });
});
