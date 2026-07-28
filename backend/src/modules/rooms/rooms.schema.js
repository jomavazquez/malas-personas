import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(1, "ROOM_NAME_REQUIRED").max(40, "ROOM_NAME_TOO_LONG"),
  gameType: z.enum(["MALAS_PERSONAS", "V_O_M"]).default("MALAS_PERSONAS"),
  deckId: z.string().min(1).optional(),
  maxPlayers: z.coerce.number().int().min(2).max(20).default(10),
  pointsToWin: z.coerce.number().int().min(1).max(50).default(5),
}).refine(
  (data) => data.gameType !== "MALAS_PERSONAS" || !!data.deckId,
  { message: "DECK_REQUIRED", path: ["deckId"] }
);

export const joinRoomSchema = z.object({
  code: z.string().length(6).toUpperCase(),
});