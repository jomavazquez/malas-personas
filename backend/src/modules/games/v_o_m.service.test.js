import { describe, it, expect, vi, afterEach } from "vitest";
import { addPlayer, submitStatements, castVote, resolveReveal, autoResolveExpiredVotes } from "./v_o_m.service.js";

const makePlayer = (overrides = {}) => ({
  socketId: `socket-${overrides.userId ?? "x"}`,
  userId: "user-1",
  username: "player",
  isGuest: false,
  score: 0,
  isSpectator: false,
  status: "idle",
  ...overrides,
});

const makeSession = (overrides = {}) => ({
  gameType: "V_O_M",
  roomCode: "ABC123",
  roomId: "room-1",
  hostId: "host-1",
  maxPlayers: 10,
  pointsToWin: 5,
  status: "playing",
  roundNumber: 1,
  protagonistIndex: 0,
  players: [],
  round: null,
  ...overrides,
});

const makeStatements = () => [
  { id: "s0", text: "truth one", isLie: false },
  { id: "s1", text: "the lie", isLie: true },
  { id: "s2", text: "truth two", isLie: false },
];

const makeRound = (overrides = {}) => ({
  protagonistUserId: "protag",
  phase: "voting",
  statements: makeStatements(),
  votes: {},
  voteDeadlineAt: Date.now() + 60000,
  voteTimeoutHandle: null,
  ...overrides,
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

  it("joins mid-game as a spectator with status 'spectator'", () => {
    const session = makeSession({ status: "playing", players: [] });

    const { player, isReconnect } = addPlayer(session, {
      socketId: "s1",
      userId: "u1",
      username: "Latecomer",
      isGuest: false,
    });

    expect(isReconnect).toBe(false);
    expect(player.isSpectator).toBe(true);
    expect(player.status).toBe("spectator");
  });
});

describe("submitStatements", () => {
  const buildWritingSession = () => {
    const protagonist = makePlayer({ userId: "protag", username: "Protag" });
    const other = makePlayer({ userId: "other", username: "Other" });
    return makeSession({
      players: [protagonist, other],
      round: { protagonistUserId: "protag", phase: "writing", statements: null, votes: {}, voteDeadlineAt: null, voteTimeoutHandle: null },
    });
  };

  it("requires exactly 3 statements", () => {
    const session = buildWritingSession();

    expect(() =>
      submitStatements(session, {
        userId: "protag",
        statements: [
          { text: "a", isLie: false },
          { text: "b", isLie: true },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_STATEMENTS_COUNT" }));
  });

  it("requires exactly 1 statement marked as the lie", () => {
    const session = buildWritingSession();

    expect(() =>
      submitStatements(session, {
        userId: "protag",
        statements: [
          { text: "a", isLie: false },
          { text: "b", isLie: false },
          { text: "c", isLie: false },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "EXACTLY_ONE_LIE_REQUIRED" }));
  });

  it("rejects submitting statements outside the writing phase", () => {
    const session = buildWritingSession();
    session.round.phase = "voting";

    expect(() =>
      submitStatements(session, {
        userId: "protag",
        statements: [
          { text: "a", isLie: false },
          { text: "b", isLie: true },
          { text: "c", isLie: false },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_PHASE" }));
  });

  it("accepts exactly 3 statements with exactly 1 lie and moves the round to voting", () => {
    const session = buildWritingSession();

    submitStatements(session, {
      userId: "protag",
      statements: [
        { text: "a", isLie: false },
        { text: "b", isLie: true },
        { text: "c", isLie: false },
      ],
    });

    expect(session.round.phase).toBe("voting");
    expect(session.round.statements).toHaveLength(3);
    expect(session.round.statements.filter((s) => s.isLie)).toHaveLength(1);
  });
});

describe("castVote", () => {
  it("rejects the protagonist trying to vote", () => {
    const protagonist = makePlayer({ userId: "protag" });
    const other = makePlayer({ userId: "other" });
    const session = makeSession({ players: [protagonist, other], round: makeRound({ protagonistUserId: "protag" }) });

    expect(() => castVote(session, { userId: "protag", statementId: "s0" })).toThrowError(
      expect.objectContaining({ code: "PROTAGONIST_CANNOT_VOTE" }),
    );
  });

  it("rejects a double vote", () => {
    const protagonist = makePlayer({ userId: "protag" });
    const voter = makePlayer({ userId: "voter" });
    const session = makeSession({ players: [protagonist, voter], round: makeRound({ protagonistUserId: "protag" }) });

    castVote(session, { userId: "voter", statementId: "s0" });

    expect(() => castVote(session, { userId: "voter", statementId: "s1" })).toThrowError(
      expect.objectContaining({ code: "ALREADY_VOTED" }),
    );
  });

  it("rejects voting outside the voting phase", () => {
    const protagonist = makePlayer({ userId: "protag" });
    const voter = makePlayer({ userId: "voter" });
    const session = makeSession({
      players: [protagonist, voter],
      round: makeRound({ protagonistUserId: "protag", phase: "writing" }),
    });

    expect(() => castVote(session, { userId: "voter", statementId: "s0" })).toThrowError(
      expect.objectContaining({ code: "INVALID_PHASE" }),
    );
  });

  it("rejects a vote for a statement that isn't part of the round", () => {
    const protagonist = makePlayer({ userId: "protag" });
    const voter = makePlayer({ userId: "voter" });
    const session = makeSession({ players: [protagonist, voter], round: makeRound({ protagonistUserId: "protag" }) });

    expect(() => castVote(session, { userId: "voter", statementId: "not-a-statement" })).toThrowError(
      expect.objectContaining({ code: "INVALID_STATEMENT" }),
    );
  });

  it("sets allVoted to true only once every eligible player has voted", () => {
    const protagonist = makePlayer({ userId: "protag" });
    const voter1 = makePlayer({ userId: "voter1" });
    const voter2 = makePlayer({ userId: "voter2" });
    const spectator = makePlayer({ userId: "spectator", isSpectator: true });
    const session = makeSession({
      players: [protagonist, voter1, voter2, spectator],
      round: makeRound({ protagonistUserId: "protag" }),
    });

    const afterFirst = castVote(session, { userId: "voter1", statementId: "s0" });
    expect(afterFirst.allVoted).toBe(false);

    const afterSecond = castVote(session, { userId: "voter2", statementId: "s1" });
    expect(afterSecond.allVoted).toBe(true);
  });
});

describe("resolveReveal", () => {
  it("awards +1 to voters who picked the lie, counts everyone else into fooledCount, and gives the protagonist +fooledCount (not per-vote)", () => {
    const protagonist = makePlayer({ userId: "protag", score: 0 });
    const correctVoter = makePlayer({ userId: "voter1", score: 0 });
    const fooledVoter1 = makePlayer({ userId: "voter2", score: 0 });
    const fooledVoter2 = makePlayer({ userId: "voter3", score: 0 });
    const session = makeSession({
      pointsToWin: 100,
      players: [protagonist, correctVoter, fooledVoter1, fooledVoter2],
      round: makeRound({
        protagonistUserId: "protag",
        votes: { voter1: "s1", voter2: "s0", voter3: "s2" },
      }),
    });

    const result = resolveReveal(session);

    expect(correctVoter.score).toBe(1);
    expect(fooledVoter1.score).toBe(0);
    expect(fooledVoter2.score).toBe(0);
    expect(result.fooledCount).toBe(2);
    expect(protagonist.score).toBe(2);
  });

  it("detects gameOver when any player's score crosses pointsToWin", () => {
    const protagonist = makePlayer({ userId: "protag", score: 0 });
    const voter = makePlayer({ userId: "voter1", score: 4 });
    const session = makeSession({
      pointsToWin: 5,
      players: [protagonist, voter],
      round: makeRound({ protagonistUserId: "protag", votes: { voter1: "s1" } }),
    });

    const result = resolveReveal(session);

    expect(voter.score).toBe(5);
    expect(result.gameOver).toBe(true);
  });

  it("reports gameOver=false when nobody has reached pointsToWin", () => {
    const protagonist = makePlayer({ userId: "protag", score: 0 });
    const voter = makePlayer({ userId: "voter1", score: 0 });
    const session = makeSession({
      pointsToWin: 5,
      players: [protagonist, voter],
      round: makeRound({ protagonistUserId: "protag", votes: { voter1: "s0" } }),
    });

    const result = resolveReveal(session);

    expect(result.gameOver).toBe(false);
  });

  it("clears a pending vote timeout handle", () => {
    const timeoutHandle = setTimeout(() => {}, 100000);
    const protagonist = makePlayer({ userId: "protag" });
    const voter = makePlayer({ userId: "voter1" });
    const session = makeSession({
      players: [protagonist, voter],
      round: makeRound({ protagonistUserId: "protag", votes: { voter1: "s0" }, voteTimeoutHandle: timeoutHandle }),
    });

    resolveReveal(session);

    expect(session.round.voteTimeoutHandle).toBeNull();
  });
});

describe("autoResolveExpiredVotes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("only fills votes for players who haven't voted yet, without touching existing votes", () => {
    const protagonist = makePlayer({ userId: "protag" });
    const alreadyVoted = makePlayer({ userId: "voter1" });
    const notVotedYet = makePlayer({ userId: "voter2" });
    const session = makeSession({
      players: [protagonist, alreadyVoted, notVotedYet],
      round: makeRound({ protagonistUserId: "protag", votes: { voter1: "s0" } }),
    });

    // Force the "random" pick for the unvoted player to land on statement index 1.
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    autoResolveExpiredVotes(session);

    expect(session.round.votes.voter1).toBe("s0");
    expect(session.round.votes.voter2).toBe("s1");
    expect(notVotedYet.status).toBe("voted");
  });
});