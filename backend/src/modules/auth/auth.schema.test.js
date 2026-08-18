import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "./auth.schema.js";

const validRegister = { email: "user@example.com", username: "user_123", password: "password1" };

describe("registerSchema", () => {
  it("accepts a valid payload", () => {
    const result = registerSchema.safeParse(validRegister);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email format", () => {
    const result = registerSchema.safeParse({ ...validRegister, email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("EMAIL_INVALID");
  });

  it("accepts a username exactly at the 3-char minimum", () => {
    const result = registerSchema.safeParse({ ...validRegister, username: "abc" });
    expect(result.success).toBe(true);
  });

  it("rejects a username one below the 3-char minimum", () => {
    const result = registerSchema.safeParse({ ...validRegister, username: "ab" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("USERNAME_TOO_SHORT");
  });

  it("accepts a username exactly at the 20-char maximum", () => {
    const result = registerSchema.safeParse({ ...validRegister, username: "a".repeat(20) });
    expect(result.success).toBe(true);
  });

  it("rejects a username one above the 20-char maximum", () => {
    const result = registerSchema.safeParse({ ...validRegister, username: "a".repeat(21) });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("USERNAME_TOO_LONG");
  });

  it("rejects a username with characters outside [a-zA-Z0-9_]", () => {
    const result = registerSchema.safeParse({ ...validRegister, username: "user name!" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("USERNAME_INVALID_CHARS");
  });

  it("accepts a password exactly at the 8-char minimum", () => {
    const result = registerSchema.safeParse({ ...validRegister, password: "12345678" });
    expect(result.success).toBe(true);
  });

  it("rejects a password one below the 8-char minimum", () => {
    const result = registerSchema.safeParse({ ...validRegister, password: "1234567" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("PASSWORD_TOO_SHORT");
  });
});

describe("loginSchema", () => {
  it("accepts a valid payload", () => {
    const result = loginSchema.safeParse({ identifier: "user@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty identifier", () => {
    const result = loginSchema.safeParse({ identifier: "", password: "anything" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("IDENTIFIER_REQUIRED");
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ identifier: "user@example.com", password: "" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("PASSWORD_REQUIRED");
  });
});