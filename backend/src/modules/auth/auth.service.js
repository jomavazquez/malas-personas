import bcrypt from "bcryptjs";
import { saveCode, verifyCode, deleteCode } from "./reset.store.js";
import jwt from "jsonwebtoken";
import prisma from "../../config/database.js";
import { env } from "../../config/env.js";

export const registerUser = async({ email, username, password }) => {

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

export const loginUser = async({ identifier, password }) => {
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
const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

export const requestPasswordReset = async( email ) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if( !user ){
    const error = new Error("EMAIL_NOT_FOUND");
    error.status = 404;
    throw error;
  }
  const code = generateCode();
  saveCode(email, code);
  return { code, username: user.username };
};

export const verifyResetCode = ( email, code ) => {
  if( !verifyCode(email, code) ){
    const error = new Error("INVALID_OR_EXPIRED_CODE");
    error.status = 400;
    throw error;
  }
};

export const resetPassword = async( email, code, newPassword ) => {
  if( !verifyCode(email, code) ){
    const error = new Error("INVALID_OR_EXPIRED_CODE");
    error.status = 400;
    throw error;
  }
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if( !user ){
    const error = new Error("EMAIL_NOT_FOUND");
    error.status = 404;
    throw error;
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { email: email.toLowerCase() }, data: { passwordHash } });
  deleteCode(email);
};