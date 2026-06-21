import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("EMAIL_INVALID"),
  username: z
    .string()
    .min(3, "USERNAME_TOO_SHORT")
    .max(20, "USERNAME_TOO_LONG")
    .regex(/^[a-zA-Z0-9_]+$/, "USERNAME_INVALID_CHARS"),
  password: z.string().min(8, "PASSWORD_TOO_SHORT"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "IDENTIFIER_REQUIRED"),
  password: z.string().min(1, "PASSWORD_REQUIRED"),
});