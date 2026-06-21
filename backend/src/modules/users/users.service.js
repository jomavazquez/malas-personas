import prisma from "../../config/database.js";

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, createdAt: true },
  });

  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.status = 404;
    throw error;
  }

  return user;
};

export const updateMe = async (userId, { username }) => {
  const existing = await prisma.user.findFirst({
    where: { username, NOT: { id: userId } },
  });

  if (existing) {
    const error = new Error("Este nombre de usuario ya está en uso");
    error.status = 409;
    throw error;
  }

  return prisma.user.update({
    where: { id: userId },
    data: { username },
    select: { id: true, email: true, username: true, createdAt: true },
  });
};
