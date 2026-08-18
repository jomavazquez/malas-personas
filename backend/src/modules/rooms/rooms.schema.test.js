import { describe, it, expect } from "vitest";
import { createRoomSchema, joinRoomSchema } from "./rooms.schema.js";

describe("createRoomSchema", () => {
  it("requires a deckId when gameType is MALAS_PERSONAS", () => {
    const result = createRoomSchema.safeParse({ name: "Room", gameType: "MALAS_PERSONAS" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("DECK_REQUIRED");
    expect(result.error.issues[0].path).toEqual(["deckId"]);
  });

  it("accepts MALAS_PERSONAS with a deckId present", () => {
    const result = createRoomSchema.safeParse({ name: "Room", gameType: "MALAS_PERSONAS", deckId: "deck-1" });
    expect(result.success).toBe(true);
  });

  it("does not require a deckId when gameType is V_O_M", () => {
    const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M" });
    expect(result.success).toBe(true);
  });

  it("still accepts V_O_M with a deckId present (not required, but not forbidden)", () => {
    const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M", deckId: "deck-1" });
    expect(result.success).toBe(true);
  });

  it("defaults gameType to MALAS_PERSONAS, so a bare room without deckId fails", () => {
    const result = createRoomSchema.safeParse({ name: "Room" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("DECK_REQUIRED");
  });

  it("rejects an empty name", () => {
    const result = createRoomSchema.safeParse({ name: "", gameType: "V_O_M" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("ROOM_NAME_REQUIRED");
  });

  it("rejects a name over 40 chars", () => {
    const result = createRoomSchema.safeParse({ name: "a".repeat(41), gameType: "V_O_M" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("ROOM_NAME_TOO_LONG");
  });

  it("accepts a name exactly at the 40-char maximum", () => {
    const result = createRoomSchema.safeParse({ name: "a".repeat(40), gameType: "V_O_M" });
    expect(result.success).toBe(true);
  });

  describe("maxPlayers boundaries (coerced from string)", () => {
    it("accepts the minimum of 2", () => {
      const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M", maxPlayers: "2" });
      expect(result.success).toBe(true);
      expect(result.data.maxPlayers).toBe(2);
    });

    it("rejects one below the minimum", () => {
      const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M", maxPlayers: "1" });
      expect(result.success).toBe(false);
    });

    it("accepts the maximum of 20", () => {
      const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M", maxPlayers: "20" });
      expect(result.success).toBe(true);
      expect(result.data.maxPlayers).toBe(20);
    });

    it("rejects one above the maximum", () => {
      const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M", maxPlayers: "21" });
      expect(result.success).toBe(false);
    });

    it("defaults to 10 when omitted", () => {
      const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M" });
      expect(result.success).toBe(true);
      expect(result.data.maxPlayers).toBe(10);
    });
  });

  describe("pointsToWin boundaries (coerced from string)", () => {
    it("accepts the minimum of 1", () => {
      const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M", pointsToWin: "1" });
      expect(result.success).toBe(true);
      expect(result.data.pointsToWin).toBe(1);
    });

    it("rejects 0", () => {
      const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M", pointsToWin: "0" });
      expect(result.success).toBe(false);
    });

    it("accepts the maximum of 50", () => {
      const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M", pointsToWin: "50" });
      expect(result.success).toBe(true);
      expect(result.data.pointsToWin).toBe(50);
    });

    it("rejects one above the maximum", () => {
      const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M", pointsToWin: "51" });
      expect(result.success).toBe(false);
    });

    it("defaults to 5 when omitted", () => {
      const result = createRoomSchema.safeParse({ name: "Room", gameType: "V_O_M" });
      expect(result.success).toBe(true);
      expect(result.data.pointsToWin).toBe(5);
    });
  });
});

describe("joinRoomSchema", () => {
  it("uppercases a lowercase 6-char code and returns the transformed value", () => {
    const result = joinRoomSchema.safeParse({ code: "ab12cd" });
    expect(result.success).toBe(true);
    expect(result.data.code).toBe("AB12CD");
  });

  it("leaves an already-uppercase 6-char code unchanged", () => {
    const result = joinRoomSchema.safeParse({ code: "AB12CD" });
    expect(result.success).toBe(true);
    expect(result.data.code).toBe("AB12CD");
  });

  it("rejects a code shorter than 6 characters", () => {
    const result = joinRoomSchema.safeParse({ code: "AB12C" });
    expect(result.success).toBe(false);
  });

  it("rejects a code longer than 6 characters", () => {
    const result = joinRoomSchema.safeParse({ code: "AB12CDE" });
    expect(result.success).toBe(false);
  });
});