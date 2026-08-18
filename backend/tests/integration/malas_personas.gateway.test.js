import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { resetDb } from "../helpers/db.js";
import { makeUser, makeDeck, makeRoom } from "../helpers/factories.js";
import { addCardToDeck } from "../../src/modules/decks/decks.service.js";
import { startTestServer, connectClient, emitAck, waitForEvent } from "../helpers/socketServer.js";

let server;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.teardown();
});

beforeEach(async () => {
  await resetDb();
});

afterEach(async () => {
  await resetDb();
});

const guestPlayer = (username) => ({ userId: randomUUID(), username });

const joinRoom = (socket, { roomCode, userId, username }) => emitAck(socket, "room:join", { roomCode, userId, username, isGuest: true });

describe("malas_personas.gateway", () => {
  it("rotates the judge to the round winner across 3 consecutive rounds, never out of sequence", async () => {
    const host = await makeUser();
    // makeDeck adds 1 BLACK + cardCount WHITE — add extra BLACK cards so >1 round is playable.
    const deck = await makeDeck({ userId: host.id, cardCount: 40 });
    for (let i = 0; i < 5; i++) {
      await addCardToDeck(host.id, deck.id, { type: "BLACK", text: `Black ${i} ____` });
    }
    const room = await makeRoom(host.id, { deckId: deck.id, maxPlayers: 10, pointsToWin: 100 });

    const hostSocket = await connectClient(server.port);
    const aliceSocket = await connectClient(server.port);
    const bobSocket = await connectClient(server.port);

    const alice = guestPlayer("Alice");
    const bob = guestPlayer("Bob");

    await joinRoom(hostSocket, { roomCode: room.code, userId: host.id, username: host.username });
    await joinRoom(aliceSocket, { roomCode: room.code, ...alice });
    await joinRoom(bobSocket, { roomCode: room.code, ...bob });

    const hands = {};
    hostSocket.on("hand:update", ({ hand }) => { hands[host.id] = hand; });
    aliceSocket.on("hand:update", ({ hand }) => { hands[alice.userId] = hand; });
    bobSocket.on("hand:update", ({ hand }) => { hands[bob.userId] = hand; });

    const sockets = { [host.id]: hostSocket, [alice.userId]: aliceSocket, [bob.userId]: bobSocket };

    const startedPromise = waitForEvent(hostSocket, "game:started");
    const roundNewPromise = waitForEvent(hostSocket, "round:new");
    await emitAck(hostSocket, "game:start", { roomCode: room.code });
    const started = await startedPromise;
    await roundNewPromise;
    await new Promise((r) => setTimeout(r, 100)); // let per-socket hand:update events land

    let currentJudgeId = started.judge.userId;
    expect(currentJudgeId).toBe(host.id); // host joined first -> judgeIndex 0

    const playRound = async (winnerId) => {
      const nonJudgeIds = Object.keys(sockets).filter((id) => id !== currentJudgeId);
      const revealPromise = waitForEvent(hostSocket, "round:reveal");

      for (const pid of nonJudgeIds) {
        const card = hands[pid][0];
        await emitAck(sockets[pid], "round:playCard", { roomCode: room.code, cardId: card.id });
      }
      await revealPromise;

      const winnerPromise = waitForEvent(hostSocket, "round:winner");
      const nextRoundPromise = waitForEvent(hostSocket, "round:new");
      await emitAck(sockets[currentJudgeId], "round:pickWinner", { roomCode: room.code, winnerUserId: winnerId });

      const winnerPayload = await winnerPromise;
      expect(winnerPayload.winner.userId).toBe(winnerId);

      const nextRound = await nextRoundPromise;
      expect(nextRound.judge.userId).toBe(winnerId);
      currentJudgeId = nextRound.judge.userId;
      await new Promise((r) => setTimeout(r, 100));
    };

    // Round 1: judge = host. Winner -> alice becomes the new judge.
    await playRound(alice.userId);
    expect(currentJudgeId).toBe(alice.userId);

    // Round 2: judge = alice. Winner -> bob becomes the new judge.
    await playRound(bob.userId);
    expect(currentJudgeId).toBe(bob.userId);

    // Round 3: judge = bob. Winner -> host again (wraps back to the original judge, in sequence).
    await playRound(host.id);
    expect(currentJudgeId).toBe(host.id);

    hostSocket.close();
    aliceSocket.close();
    bobSocket.close();
  }, 20000);

  it("rejects a 3rd room:join with ROOM_FULL when maxPlayers is 2", async () => {
    const host = await makeUser();
    const room = await makeRoom(host.id, { maxPlayers: 2 });

    const hostSocket = await connectClient(server.port);
    const aliceSocket = await connectClient(server.port);
    const bobSocket = await connectClient(server.port);

    await joinRoom(hostSocket, { roomCode: room.code, userId: host.id, username: host.username });
    await joinRoom(aliceSocket, { roomCode: room.code, ...guestPlayer("Alice") });

    const result = await joinRoom(bobSocket, { roomCode: room.code, ...guestPlayer("Bob") });

    expect(result.error).toBe("ROOM_FULL");

    hostSocket.close();
    aliceSocket.close();
    bobSocket.close();
  });

  it("rebalances judging to a remaining player, without crashing, when the judge disconnects mid-round", async () => {
    const host = await makeUser();
    const deck = await makeDeck({ userId: host.id, cardCount: 20 });
    const room = await makeRoom(host.id, { deckId: deck.id, maxPlayers: 10, pointsToWin: 100 });

    const hostSocket = await connectClient(server.port);
    const aliceSocket = await connectClient(server.port);
    const bobSocket = await connectClient(server.port);

    const alice = guestPlayer("Alice");
    const bob = guestPlayer("Bob");

    // Join order matters: host first -> judgeIndex 0 -> host is the initial judge.
    await joinRoom(hostSocket, { roomCode: room.code, userId: host.id, username: host.username });
    await joinRoom(aliceSocket, { roomCode: room.code, ...alice });
    await joinRoom(bobSocket, { roomCode: room.code, ...bob });

    const hands = {};
    aliceSocket.on("hand:update", ({ hand }) => { hands[alice.userId] = hand; });
    bobSocket.on("hand:update", ({ hand }) => { hands[bob.userId] = hand; });

    const roundNewPromise = waitForEvent(hostSocket, "round:new");
    await emitAck(hostSocket, "game:start", { roomCode: room.code });
    await roundNewPromise;
    await new Promise((r) => setTimeout(r, 100));

    // Non-judge players (alice, bob) both play — round fills up under the original judge (host).
    const revealPromise = waitForEvent(aliceSocket, "round:reveal");
    await emitAck(aliceSocket, "round:playCard", { roomCode: room.code, cardId: hands[alice.userId][0].id });
    await emitAck(bobSocket, "round:playCard", { roomCode: room.code, cardId: hands[bob.userId][0].id });
    await revealPromise;

    // The judge (host) disconnects mid-round, before picking a winner.
    const playerLeftPromise = waitForEvent(aliceSocket, "room:playerLeft");
    await emitAck(hostSocket, "room:leave", { roomCode: room.code });
    const left = await playerLeftPromise;
    expect(left.userId).toBe(host.id);
    hostSocket.close();

    // After the judge leaves, judgeIndex now implicitly points at a valid remaining
    // player (alice, per removePlayer's splice-and-reset logic) — asserting this by
    // having alice successfully act as judge and pick bob as the round's winner.
    const winnerPromise = waitForEvent(bobSocket, "round:winner");
    const ack = await emitAck(aliceSocket, "round:pickWinner", { roomCode: room.code, winnerUserId: bob.userId });
    expect(ack.success).toBe(true);

    const winnerPayload = await winnerPromise;
    expect(winnerPayload.winner.userId).toBe(bob.userId);
    // Never targets the removed judge.
    winnerPayload.scores.forEach((s) => expect(s.userId).not.toBe(host.id));

    aliceSocket.close();
    bobSocket.close();
  }, 20000);
});