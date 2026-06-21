import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(1, "ROOM_NAME_REQUIRED").max(40, "ROOM_NAME_TOO_LONG"),
  deckId: z.string().min(1, "DECK_REQUIRED"),
  maxPlayers: z.coerce.number().int().min(2).max(20).default(10),
  pointsToWin: z.coerce.number().int().min(1).max(50).default(5),
});

export const joinRoomSchema = z.object({
  code: z.string().length(6).toUpperCase(),
});