import { describe, expect, test } from "vitest";
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/lib/auth/password";

describe("password hashing", () => {
  test("hashes and verifies a password", async () => {
    const hash = await hashPassword("correct horse battery");

    await expect(verifyPassword("correct horse battery", hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  test("produces a unique salt per hash", async () => {
    const first = await hashPassword("same password");
    const second = await hashPassword("same password");

    expect(first).not.toBe(second);
    await expect(verifyPassword("same password", first)).resolves.toBe(true);
    await expect(verifyPassword("same password", second)).resolves.toBe(true);
  });

  test("rejects malformed stored hashes instead of throwing", async () => {
    await expect(verifyPassword("anything", "not-a-hash")).resolves.toBe(false);
    await expect(verifyPassword("anything", "bcrypt$x$y$z$a$b")).resolves.toBe(
      false,
    );
  });

  test("validates minimum password length", () => {
    expect(validatePassword("short")).toMatch(/at least 8/);
    expect(validatePassword("long enough password")).toBeNull();
  });
});
