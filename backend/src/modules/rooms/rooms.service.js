import prisma from "../../config/database.js";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateRoomCode = async () => {
  let code;
  let exists = true;
  while( exists ){
    code = Array.from({ length: 6 }, () =>
      ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
    ).join("");
    const room = await prisma.room.findUnique({ where: { code } });
    exists = !!room;
  }
  return code;
};

export const createRoom = async( hostId, { deckId, maxPlayers, pointsToWin, name } ) => {
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if( !deck ){
    const error = new Error("SELECTED_DECK_NOT_EXISTS");
    error.status = 404;
    throw error;
  }

  const code = await generateRoomCode();

  const room = await prisma.room.create({
    data: { code, hostId, deckId, maxPlayers, pointsToWin, ...(name && { name }) },
    select: {
      id: true, code: true, name: true, status: true, isActive: true,
      maxPlayers: true, pointsToWin: true, createdAt: true,
      deck: { select: { id: true, name: true, language: true } },
    },
  });

  return room;
};

export const getRoomByCode = async( code ) => {
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      id: true, code: true, status: true, isActive: true,
      maxPlayers: true, pointsToWin: true, createdAt: true,
      host: { select: { id: true, username: true } },
      deck: { select: { id: true, name: true, language: true } },
    },
  });

  if( !room ){
    const error = new Error("ROOM_NOT_FOUND");
    error.status = 404;
    throw error;
  }

  return room;
};

export const closeRoom = async( hostId, code ) => {
  const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() } });

  if( !room ){
    const error = new Error("ROOM_NOT_FOUND");
    error.status = 404;
    throw error;
  }
  if( room.hostId !== hostId ){
    const error = new Error("ONLY_HOST_CAN_CLOSE_THE_ROOM");
    error.status = 403;
    throw error;
  }
  if( !room.isActive ){
    const error = new Error("ROOM_ALREADY_CLOSE");
    error.status = 409;
    throw error;
  }

  return prisma.room.update({
    where: { code: code.toUpperCase() },
    data: { isActive: false, status: "FINISHED", finishedAt: new Date() },
    select: { id: true, code: true, status: true, isActive: true, finishedAt: true },
  });
};

export const getMyRooms = async( userId ) => {
  return prisma.room.findMany({
    where: { hostId: userId },
    select: {
      id: true, code: true, name: true, status: true, isActive: true,
      maxPlayers: true, pointsToWin: true, createdAt: true, finishedAt: true,
      deck: { select: { id: true, name: true, language: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const deleteRoom = async( userId, code ) => {
  const room = await prisma.room.findUnique({ where: { code } });
  if( !room ) throw Object.assign(new Error("ROOM_NOT_FOUND"), { code: "ROOM_NOT_FOUND" });
  if( room.hostId !== userId ) throw Object.assign(new Error("UNAUTHORIZED"), { code: "UNAUTHORIZED" });
  await prisma.room.delete({ where: { code } });
  return { success: true };
};