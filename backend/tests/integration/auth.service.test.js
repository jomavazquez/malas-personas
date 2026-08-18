import { describe, it, expect, beforeEach, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import { resetDb } from "../helpers/db.js";
import { registerUser, loginUser, requestPasswordReset, verifyResetCode, resetPassword } from "../../src/modules/auth/auth.service.js";
import prisma from "../../src/config/database.js";

beforeEach(async () => {
  await resetDb();
});

afterEach(async () => {
  await resetDb();
});

describe("registerUser", () => {
  it("creates a user with a real bcrypt password hash and returns a token", async () => {
    const { user, token } = await registerUser({
      email: "alice@example.com",
      username: "alice",
      password: "supersecret1",
    });

    expect(user.email).toBe("alice@example.com");
    expect(user.username).toBe("alice");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored.passwordHash).not.toBe("supersecret1");
    expect(await bcrypt.compare("supersecret1", stored.passwordHash)).toBe(true);
  });

  it("rejects a duplicate email even with a different username", async () => {
    await registerUser({ email: "dup@example.com", username: "first", password: "password123" });

    await expect(
      registerUser({ email: "dup@example.com", username: "second", password: "password123" }),
    ).rejects.toThrowError(expect.objectContaining({ message: "EMAIL_IN_USE", status: 409 }));
  });

  it("rejects a duplicate username even with a different email", async () => {
    await registerUser({ email: "first@example.com", username: "dupname", password: "password123" });

    await expect(
      registerUser({ email: "second@example.com", username: "dupname", password: "password123" }),
    ).rejects.toThrowError(expect.objectContaining({ message: "USERNAME_IN_USE", status: 409 }));
  });
});

describe("loginUser", () => {
  it("logs in with email + correct password", async () => {
    await registerUser({ email: "bob@example.com", username: "bob", password: "correcthorse" });

    const { user, token } = await loginUser({ identifier: "bob@example.com", password: "correcthorse" });

    expect(user.email).toBe("bob@example.com");
    expect(user.passwordHash).toBeUndefined();
    expect(typeof token).toBe("string");
  });

  it("logs in with username + correct password", async () => {
    await registerUser({ email: "carol@example.com", username: "carol", password: "correcthorse" });

    const { user } = await loginUser({ identifier: "carol", password: "correcthorse" });

    expect(user.username).toBe("carol");
  });

  it("rejects an unknown identifier", async () => {
    await expect(
      loginUser({ identifier: "nobody@example.com", password: "whatever1" }),
    ).rejects.toThrowError(expect.objectContaining({ message: "INVALID_CREDENTIALS", status: 401 }));
  });

  it("rejects a wrong password for an existing user", async () => {
    await registerUser({ email: "dave@example.com", username: "dave", password: "correcthorse" });

    await expect(
      loginUser({ identifier: "dave@example.com", password: "wrongpassword" }),
    ).rejects.toThrowError(expect.objectContaining({ message: "INVALID_CREDENTIALS", status: 401 }));
  });
});

describe("password reset flow", () => {
  it("issues a code, verifies it, and lets the user set a new password they can then log in with", async () => {
    await registerUser({ email: "erin@example.com", username: "erin", password: "oldpassword1" });

    const { code } = await requestPasswordReset("erin@example.com");
    expect(typeof code).toBe("string");

    expect(() => verifyResetCode("erin@example.com", code)).not.toThrow();

    await resetPassword("erin@example.com", code, "newpassword1");

    await expect(
      loginUser({ identifier: "erin@example.com", password: "oldpassword1" }),
    ).rejects.toThrowError(expect.objectContaining({ message: "INVALID_CREDENTIALS" }));

    const { user } = await loginUser({ identifier: "erin@example.com", password: "newpassword1" });
    expect(user.email).toBe("erin@example.com");
  });

  it("rejects a wrong reset code", async () => {
    await registerUser({ email: "frank@example.com", username: "frank", password: "password123" });
    await requestPasswordReset("frank@example.com");

    expect(() => verifyResetCode("frank@example.com", "000000")).toThrowError(
      expect.objectContaining({ message: "INVALID_OR_EXPIRED_CODE", status: 400 }),
    );
  });

  it("rejects requesting a reset for an email that doesn't exist", async () => {
    await expect(requestPasswordReset("ghost@example.com")).rejects.toThrowError(
      expect.objectContaining({ message: "EMAIL_NOT_FOUND", status: 404 }),
    );
  });
});