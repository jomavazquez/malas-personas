import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resetDb } from "../helpers/db.js";
import { makeUser, makeDeck, makeRoom } from "../helpers/factories.js";
import { createRoom, closeRoom, deleteRoom, getRoomByCode } from "../../src/modules/rooms/rooms.service.js";

beforeEach(async () => {
  await resetDb();
});

afterEach(async () => {
  await resetDb();
});

describe("createRoom", () => {
  it("never generates a colliding room code across many sequential creates", async () => {
    const host = await makeUser();
    const deck = await makeDeck({ userId: host.id });

    const rooms = [];
    for (let i = 0; i < 15; i++) {
      const room = await createRoom(host.id, {
        name: `Room ${i}`,
        gameType: "MALAS_PERSONAS",
        deckId: deck.id,
        maxPlayers: 10,
        pointsToWin: 5,
      });
      rooms.push(room);
    }

    const codes = rooms.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
    codes.forEach((code) => expect(code).toHaveLength(6));
  });

  it("rejects a bad/missing deckId when gameType requires one", async () => {
    const host = await makeUser();

    await expect(
      createRoom(host.id, {
        name: "No deck room",
        gameType: "MALAS_PERSONAS",
        deckId: "not-a-real-deck-id",
        maxPlayers: 10,
        pointsToWin: 5,
      }),
    ).rejects.toThrowError(expect.objectContaining({ message: "SELECTED_DECK_NOT_EXISTS", status: 404 }));
  });

  it("does not require a deck for V_O_M rooms and persists deckId as null", async () => {
    const host = await makeUser();

    const room = await createRoom(host.id, {
      name: "VoM room",
      gameType: "V_O_M",
      maxPlayers: 10,
      pointsToWin: 5,
    });

    const fetched = await getRoomByCode(room.code);
    expect(fetched.gameType).toBe("V_O_M");
  });
});

describe("closeRoom", () => {
  it("allows the host to close their own room", async () => {
    const host = await makeUser();
    const room = await makeRoom(host.id);

    const closed = await closeRoom(host.id, room.code);

    expect(closed.isActive).toBe(false);
    expect(closed.status).toBe("FINISHED");
  });

  it("rejects a non-host trying to close the room", async () => {
    const host = await makeUser();
    const intruder = await makeUser();
    const room = await makeRoom(host.id);

    await expect(closeRoom(intruder.id, room.code)).rejects.toThrowError(
      expect.objectContaining({ message: "ONLY_HOST_CAN_CLOSE_THE_ROOM", status: 403 }),
    );
  });

  it("rejects closing an already-closed room", async () => {
    const host = await makeUser();
    const room = await makeRoom(host.id);
    await closeRoom(host.id, room.code);

    await expect(closeRoom(host.id, room.code)).rejects.toThrowError(
      expect.objectContaining({ message: "ROOM_ALREADY_CLOSE", status: 409 }),
    );
  });
});

describe("deleteRoom", () => {
  it("allows the host to delete their own room", async () => {
    const host = await makeUser();
    const room = await makeRoom(host.id);

    await expect(deleteRoom(host.id, room.code)).resolves.toEqual({ success: true });
    await expect(getRoomByCode(room.code)).rejects.toThrowError(
      expect.objectContaining({ message: "ROOM_NOT_FOUND" }),
    );
  });

  it("rejects a non-host trying to delete the room", async () => {
    const host = await makeUser();
    const intruder = await makeUser();
    const room = await makeRoom(host.id);

    await expect(deleteRoom(intruder.id, room.code)).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    );
  });
});