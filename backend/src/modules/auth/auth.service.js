import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/database.js";
import { env } from "../../config/env.js";

export const registerUser = async ({ email, username, password }) => {

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if( existingUser ){
    const error = new Error(existingUser.email === email ? "EMAIL_IN_USE" : "USERNAME_IN_USE");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, username, passwordHash },
    select: { id: true, email: true, username: true, createdAt: true },
  });

  const token = signToken(user.id);
  return { user, token };
};

export const loginUser = async ({ identifier, password }) => {
  const isEmail = identifier.includes("@");

  const user = await prisma.user.findFirst({
    where: isEmail ? { email: identifier } : { username: identifier },
    select: { id: true, email: true, username: true, createdAt: true, passwordHash: true },
  });

  if( !user ){
    const error = new Error("INVALID_CREDENTIALS");
    error.status = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if( !isPasswordValid ){
    const error = new Error("INVALID_CREDENTIALS");
    error.status = 401;
    throw error;
  }

  const { passwordHash: _, ...safeUser } = user;
  const token = signToken(user.id);
  return { user: safeUser, token };
};

const signToken = (userId) => jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });