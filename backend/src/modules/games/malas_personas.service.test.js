import { describe, it, expect } from "vitest";
import { addPlayer, removePlayer, playCard, pickWinner } from "./malas_personas.service.js";

const makePlayer = (overrides = {}) => ({
  socketId: `socket-${overrides.userId ?? "x"}`,
  userId: "user-1",
  username: "player",
  isGuest: false,
  hand: [],
  score: 0,
  isSpectator: false,
  hasRedrawn: false,
  ...overrides,
});

const makeSession = (overrides = {}) => ({
  roomCode: "ABC123",
  roomId: "room-1",
  hostId: "host-1",
  deckId: "deck-1",
  maxPlayers: 10,
  pointsToWin: 5,
  status: "waiting",
  players: [],
  judgeIndex: 0,
  currentBlackCard: { id: "b1", type: "BLACK", text: "____" },
  playedCards: [],
  blackDeck: [],
  whiteDeck: [],
  ...overrides,
});

describe("pickWinner", () => {
  it("rotates the judge to the winner, including wrap-around when the winner is the last player", () => {
    const p0 = makePlayer({ userId: "p0", username: "Zero" });
    const p1 = makePlayer({ userId: "p1", username: "One" });
    const p2 = makePlayer({ userId: "p2", username: "Two" });
    const session = makeSession({
      players: [p0, p1, p2],
      judgeIndex: 0,
      playedCards: [
        { userId: "p1", username: "One", card: { id: "w1", type: "WHITE", text: "..." } },
        { userId: "p2", username: "Two", card: { id: "w2", type: "WHITE", text: "..." } },
      ],
    });

    const result = pickWinner(session, { judgeUserId: "p0", winnerUserId: "p2" });

    expect(result.winner.userId).toBe("p2");
    expect(session.judgeIndex).toBe(2);
  });

  it("rotates the judge to a winner in the middle of the array", () => {
    const p0 = makePlayer({ userId: "p0", username: "Zero" });
    const p1 = makePlayer({ userId: "p1", username: "One" });
    const p2 = makePlayer({ userId: "p2", username: "Two" });
    const session = makeSession({
      players: [p0, p1, p2],
      judgeIndex: 2,
      playedCards: [
        { userId: "p0", username: "Zero", card: { id: "w1", type: "WHITE", text: "..." } },
        { userId: "p1", username: "One", card: { id: "w2", type: "WHITE", text: "..." } },
      ],
    });

    pickWinner(session, { judgeUserId: "p2", winnerUserId: "p1" });

    expect(session.judgeIndex).toBe(1);
  });

  it("throws NOT_THE_JUDGE when the caller isn't the current judge", () => {
    const p0 = makePlayer({ userId: "p0" });
    const p1 = makePlayer({ userId: "p1" });
    const session = makeSession({
      players: [p0, p1],
      judgeIndex: 0,
      playedCards: [{ userId: "p1", username: "player", card: { id: "w1", type: "WHITE", text: "..." } }],
    });

    expect(() => pickWinner(session, { judgeUserId: "p1", winnerUserId: "p1" })).toThrowError(
      expect.objectContaining({ code: "NOT_THE_JUDGE" }),
    );
  });

  it("reports gameOver=true exactly when the winner's score reaches pointsToWin", () => {
    const p0 = makePlayer({ userId: "p0" });
    const p1 = makePlayer({ userId: "p1", score: 2 });
    const session = makeSession({
      players: [p0, p1],
      judgeIndex: 0,
      pointsToWin: 3,
      playedCards: [{ userId: "p1", username: "player", card: { id: "w1", type: "WHITE", text: "..." } }],
    });

    const result = pickWinner(session, { judgeUserId: "p0", winnerUserId: "p1" });

    expect(p1.score).toBe(3);
    expect(result.gameOver).toBe(true);
  });

  it("reports gameOver=false one point below pointsToWin", () => {
    const p0 = makePlayer({ userId: "p0" });
    const p1 = makePlayer({ userId: "p1", score: 1 });
    const session = makeSession({
      players: [p0, p1],
      judgeIndex: 0,
      pointsToWin: 3,
      playedCards: [{ userId: "p1", username: "player", card: { id: "w1", type: "WHITE", text: "..." } }],
    });

    const result = pickWinner(session, { judgeUserId: "p0", winnerUserId: "p1" });

    expect(p1.score).toBe(2);
    expect(result.gameOver).toBe(false);
  });

  it("throws a graceful WINNER_NOT_FOUND-style error when the picked winner already disconnected (regression)", () => {
    // Simulates the bug: the departing player was spliced out of session.players
    // by removePlayer, but their play is still sitting in playedCards.
    const judge = makePlayer({ userId: "judge-1", username: "Judge" });
    const remainingPlayer = makePlayer({ userId: "p-remaining", username: "Remaining" });
    const session = makeSession({
      players: [judge, remainingPlayer],
      judgeIndex: 0,
      playedCards: [
        { userId: "p-disconnected", username: "Ghost", card: { id: "w1", type: "WHITE", text: "..." } },
        { userId: "p-remaining", username: "Remaining", card: { id: "w2", type: "WHITE", text: "..." } },
      ],
    });

    // Before the fix, this line would throw a raw TypeError
    // ("Cannot read properties of undefined (reading 'score')") because
    // session.players.find(...) returns undefined for the disconnected userId
    // while playedCards still has a stale entry for them.
    expect(() => pickWinner(session, { judgeUserId: "judge-1", winnerUserId: "p-disconnected" })).toThrowError(
      expect.objectContaining({ code: "WINNER_NOT_FOUND" }),
    );
  });
});

describe("addPlayer", () => {
  it("reconnects an existing userId in place: sets isReconnect and doesn't grow the players array", () => {
    const existing = makePlayer({ userId: "u1", username: "Alice", socketId: "old-socket" });
    const session = makeSession({ players: [existing] });

    const { player, isReconnect } = addPlayer(session, {
      socketId: "new-socket",
      userId: "u1",
      username: "Alice",
      isGuest: false,
    });

    expect(isReconnect).toBe(true);
    expect(player.socketId).toBe("new-socket");
    expect(session.players).toHaveLength(1);
    expect(session.players[0]).toBe(existing);
  });

  it("throws DUPLICATE_PLAYER for a username collision regardless of case/whitespace", () => {
    const existing = makePlayer({ userId: "u1", username: "Alice" });
    const session = makeSession({ players: [existing] });

    expect(() =>
      addPlayer(session, { socketId: "s2", userId: "u2", username: "  ALICE  ", isGuest: false }),
    ).toThrowError(expect.objectContaining({ code: "DUPLICATE_PLAYER" }));
  });

  it("throws ROOM_FULL when the room is at maxPlayers", () => {
    const session = makeSession({
      maxPlayers: 1,
      players: [makePlayer({ userId: "u1", username: "Alice" })],
    });

    expect(() =>
      addPlayer(session, { socketId: "s2", userId: "u2", username: "Bob", isGuest: false }),
    ).toThrowError(expect.objectContaining({ code: "ROOM_FULL" }));
  });

  it("joins mid-game as a spectator with an empty hand, leaving whiteDeck untouched", () => {
    const whiteDeck = [{ id: "w1", type: "WHITE", text: "..." }];
    const session = makeSession({ status: "playing", whiteDeck });

    const { player, isReconnect } = addPlayer(session, {
      socketId: "s1",
      userId: "u1",
      username: "Latecomer",
      isGuest: false,
    });

    expect(isReconnect).toBe(false);
    expect(player.isSpectator).toBe(true);
    expect(player.hand).toEqual([]);
    expect(session.whiteDeck).toBe(whiteDeck);
    expect(session.whiteDeck).toHaveLength(1);
  });
});

describe("removePlayer", () => {
  it("resets judgeIndex to 0 when the judge is removed and judgeIndex would be out of bounds", () => {
    const p0 = makePlayer({ userId: "p0", socketId: "s0" });
    const p1 = makePlayer({ userId: "p1", socketId: "s1" });
    const p2 = makePlayer({ userId: "p2", socketId: "s2" });
    const session = makeSession({ players: [p0, p1, p2], judgeIndex: 2 });

    const { removed } = removePlayer(session, "s2");

    expect(removed.userId).toBe("p2");
    expect(session.players).toHaveLength(2);
    expect(session.judgeIndex).toBe(0);
  });

  it("leaves judgeIndex untouched when removing a player doesn't push it out of bounds", () => {
    const p0 = makePlayer({ userId: "p0", socketId: "s0" });
    const p1 = makePlayer({ userId: "p1", socketId: "s1" });
    const p2 = makePlayer({ userId: "p2", socketId: "s2" });
    const session = makeSession({ players: [p0, p1, p2], judgeIndex: 1 });

    removePlayer(session, "s2");

    expect(session.players).toHaveLength(2);
    expect(session.judgeIndex).toBe(1);
  });

  it("returns removed: null when the socketId isn't found", () => {
    const session = makeSession({ players: [makePlayer({ userId: "p0", socketId: "s0" })] });

    const { removed } = removePlayer(session, "unknown-socket");

    expect(removed).toBeNull();
    expect(session.players).toHaveLength(1);
  });
});

describe("playCard", () => {
  const buildTwoPlayerSession = () => {
    const judge = makePlayer({ userId: "judge-1", username: "Judge" });
    const player = makePlayer({
      userId: "p1",
      username: "Player",
      hand: [
        { id: "c1", type: "WHITE", text: "one" },
        { id: "c2", type: "WHITE", text: "two" },
      ],
    });
    return makeSession({
      players: [judge, player],
      judgeIndex: 0,
      whiteDeck: [{ id: "c3", type: "WHITE", text: "three" }],
    });
  };

  it("throws JUDGE_CANNOT_PLAY when the judge tries to play", () => {
    const session = buildTwoPlayerSession();

    expect(() => playCard(session, { userId: "judge-1", cardId: "c1" })).toThrowError(
      expect.objectContaining({ code: "JUDGE_CANNOT_PLAY" }),
    );
  });

  it("throws ALREADY_PLAYED when the player already played this round", () => {
    const session = buildTwoPlayerSession();
    session.playedCards.push({ userId: "p1", username: "Player", card: { id: "c1", type: "WHITE", text: "one" } });

    expect(() => playCard(session, { userId: "p1", cardId: "c2" })).toThrowError(
      expect.objectContaining({ code: "ALREADY_PLAYED" }),
    );
  });

  it("throws CARD_NOT_IN_HAND when the card isn't in the player's hand", () => {
    const session = buildTwoPlayerSession();

    expect(() => playCard(session, { userId: "p1", cardId: "not-a-card" })).toThrowError(
      expect.objectContaining({ code: "CARD_NOT_IN_HAND" }),
    );
  });

  it("refills the hand by 1 on a successful play and reports allPlayed/totalNeeded correctly", () => {
    const session = buildTwoPlayerSession();
    const player = session.players[1];

    const result = playCard(session, { userId: "p1", cardId: "c1" });

    expect(player.hand).toHaveLength(2);
    expect(player.hand.map((c) => c.id)).toEqual(["c2", "c3"]);
    expect(session.whiteDeck).toHaveLength(0);
    expect(result.totalNeeded).toBe(1);
    expect(result.allPlayed).toBe(true);
  });

  it("reports allPlayed=false while some non-judge, non-spectator players haven't played yet", () => {
    const judge = makePlayer({ userId: "judge-1", username: "Judge" });
    const p1 = makePlayer({ userId: "p1", username: "P1", hand: [{ id: "c1", type: "WHITE", text: "one" }] });
    const p2 = makePlayer({ userId: "p2", username: "P2", hand: [{ id: "c2", type: "WHITE", text: "two" }] });
    const session = makeSession({ players: [judge, p1, p2], judgeIndex: 0, whiteDeck: [] });

    const result = playCard(session, { userId: "p1", cardId: "c1" });

    expect(result.allPlayed).toBe(false);
    expect(result.totalNeeded).toBe(2);
  });
});