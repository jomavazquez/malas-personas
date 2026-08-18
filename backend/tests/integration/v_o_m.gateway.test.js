import { randomUUID } from "node:crypto";
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { resetDb } from "../helpers/db.js";
import { makeUser, makeRoom } from "../helpers/factories.js";
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
  vi.restoreAllMocks();
});

const guestPlayer = (username) => ({ userId: randomUUID(), username });

const joinRoom = (socket, { roomCode, userId, username }) => emitAck(socket, "room:join", { roomCode, userId, username, isGuest: true });

const statementsWithLieAt = (lieIndex) => [0, 1, 2].map((i) => ({ text: i === lieIndex ? "the lie" : `truth ${i}`, isLie: i === lieIndex }));

describe("v_o_m.gateway", () => {
  it("aborts the round and starts a new one with a different protagonist when the protagonist leaves mid-voting", async () => {
    const host = await makeUser();
    const room = await makeRoom(host.id, { gameType: "V_O_M", pointsToWin: 100 });

    const hostSocket = await connectClient(server.port);
    const aliceSocket = await connectClient(server.port);
    const bobSocket = await connectClient(server.port);

    const alice = guestPlayer("Alice");
    const bob = guestPlayer("Bob");

    // Join order matters: host first -> protagonistIndex 0 -> host is the initial protagonist.
    await joinRoom(hostSocket, { roomCode: room.code, userId: host.id, username: host.username });
    await joinRoom(aliceSocket, { roomCode: room.code, ...alice });
    await joinRoom(bobSocket, { roomCode: room.code, ...bob });

    const roundNewPromise = waitForEvent(aliceSocket, "vom:round:new");
    const startAck = await emitAck(hostSocket, "vom:start", { roomCode: room.code });
    expect(startAck.success).toBe(true);
    const firstRound = await roundNewPromise;
    expect(firstRound.protagonist.userId).toBe(host.id);

    const votingPromise = waitForEvent(aliceSocket, "vom:round:voting");
    await emitAck(hostSocket, "vom:statements:submit", {
      roomCode: room.code,
      statements: statementsWithLieAt(1),
    });
    await votingPromise;

    // Protagonist (host) leaves mid-voting.
    const abortedPromise = waitForEvent(aliceSocket, "vom:round:aborted");
    const newRoundPromise = waitForEvent(aliceSocket, "vom:round:new");
    await emitAck(hostSocket, "room:leave", { roomCode: room.code });

    const aborted = await abortedPromise;
    expect(aborted.reason).toBe("PROTAGONIST_LEFT");

    const newRound = await newRoundPromise;
    expect(newRound.protagonist.userId).not.toBe(host.id);
    expect([alice.userId, bob.userId]).toContain(newRound.protagonist.userId);

    hostSocket.close();
    aliceSocket.close();
    bobSocket.close();
  }, 20000);

  it("auto-resolves on vote timeout, correctly scoring the auto-assigned non-voter", async () => {
    // Forces autoResolveExpiredVotes' random pick to statement index 0 (not the lie,
    // which we place at index 1), so bob (the non-voter) is deterministically fooled.
    vi.spyOn(Math, "random").mockReturnValue(0);

    const host = await makeUser();
    const room = await makeRoom(host.id, { gameType: "V_O_M", pointsToWin: 100 });

    const hostSocket = await connectClient(server.port);
    const aliceSocket = await connectClient(server.port);
    const bobSocket = await connectClient(server.port);

    const alice = guestPlayer("Alice");
    const bob = guestPlayer("Bob");

    await joinRoom(hostSocket, { roomCode: room.code, userId: host.id, username: host.username });
    await joinRoom(aliceSocket, { roomCode: room.code, ...alice });
    await joinRoom(bobSocket, { roomCode: room.code, ...bob });

    await emitAck(hostSocket, "vom:start", { roomCode: room.code });

    const votingPromise = waitForEvent(aliceSocket, "vom:round:voting");
    await emitAck(hostSocket, "vom:statements:submit", {
      roomCode: room.code,
      statements: statementsWithLieAt(1), // lie is "s1"
    });
    await votingPromise;

    const revealPromise = waitForEvent(aliceSocket, "vom:round:reveal");
    // Alice correctly votes the lie; bob never votes and gets auto-resolved on timeout.
    await emitAck(aliceSocket, "vom:vote:cast", { roomCode: room.code, statementId: "s1" });

    const reveal = await revealPromise; // relies on the shortened VOM_VOTE_DURATION_MS from .env.test

    expect(reveal.fooledCount).toBe(1); // only bob, auto-assigned to non-lie statement s0
    const aliceScore = reveal.scores.find((s) => s.userId === alice.userId).score;
    const hostScore = reveal.scores.find((s) => s.userId === host.id).score;
    expect(aliceScore).toBe(1); // correctly identified the lie
    expect(hostScore).toBe(1); // protagonist gets +fooledCount

    hostSocket.close();
    aliceSocket.close();
    bobSocket.close();
  }, 20000);

  it("resolves immediately (without waiting for the timeout) when the last non-voter disconnects", async () => {
    const host = await makeUser();
    const room = await makeRoom(host.id, { gameType: "V_O_M", pointsToWin: 100 });

    const hostSocket = await connectClient(server.port);
    const aliceSocket = await connectClient(server.port);
    const bobSocket = await connectClient(server.port);

    const alice = guestPlayer("Alice");
    const bob = guestPlayer("Bob");

    await joinRoom(hostSocket, { roomCode: room.code, userId: host.id, username: host.username });
    await joinRoom(aliceSocket, { roomCode: room.code, ...alice });
    await joinRoom(bobSocket, { roomCode: room.code, ...bob });

    await emitAck(hostSocket, "vom:start", { roomCode: room.code });

    const votingPromise = waitForEvent(aliceSocket, "vom:round:voting");
    await emitAck(hostSocket, "vom:statements:submit", {
      roomCode: room.code,
      statements: statementsWithLieAt(1),
    });
    await votingPromise;

    await emitAck(aliceSocket, "vom:vote:cast", { roomCode: room.code, statementId: "s1" });

    const revealPromise = waitForEvent(aliceSocket, "vom:round:reveal");
    const start = Date.now();
    // bob is the only non-voter left — leaving should trigger isRoundFullyVoted's
    // immediate finishVoting path, not the ~500ms VOM_VOTE_DURATION_MS fallback.
    await emitAck(bobSocket, "room:leave", { roomCode: room.code });

    await revealPromise;
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(400);

    hostSocket.close();
    aliceSocket.close();
    bobSocket.close();
  }, 20000);
});