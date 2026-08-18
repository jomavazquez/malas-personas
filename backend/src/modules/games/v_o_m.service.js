import prisma from "../../config/database.js";
import { setSession } from "./games.state.js";

const MIN_PLAYERS_TO_START = 2;
// Optional env override lets integration tests shrink the voting window — see backend/env.example.
// Must stay in sync with the same-named constant read in v_o_m.gateway.js (which actually schedules the timeout).
const VOTE_DURATION_MS = Number(process.env.VOM_VOTE_DURATION_MS) || 60000;

export const buildSession = ( room ) => {
  const session = {
    gameType: "V_O_M",
    roomCode: room.code,
    roomId: room.id,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    pointsToWin: room.pointsToWin,
    status: "waiting",
    roundNumber: 0,
    protagonistIndex: 0,
    players: [],
    round: null,
  };

  setSession(room.code, session);
  return session;
};

export const addPlayer = ( session, { socketId, userId, username, isGuest } ) => {
  const existing = session.players.find((p) => p.userId === userId);
  if( existing ){
    existing.socketId = socketId;
    return { session, player: existing, isReconnect: true };
  }

  if( session.players.length >= session.maxPlayers ){
    const error = new Error("ROOM_FULL");
    error.code = "ROOM_FULL";
    throw error;
  }

  const nameTaken = session.players.some((p) => p.username.trim().toLowerCase() === username.trim().toLowerCase());
  if( nameTaken ){
    const error = new Error("DUPLICATE_PLAYER");
    error.code = "DUPLICATE_PLAYER";
    throw error;
  }

  const isSpectator = session.status === "playing";
  const player = {
    socketId, userId, username, isGuest: !!isGuest,
    score: 0, isSpectator,
    status: isSpectator ? "spectator" : "idle",
  };
  session.players.push(player);

  return { session, player, isReconnect: false };
};

export const removePlayer = ( session, socketId ) => {
  const index = session.players.findIndex((p) => p.socketId === socketId);
  if( index === -1 ) return { session, removed: null };

  const [ removed ] = session.players.splice(index, 1);

  if( session.protagonistIndex >= session.players.length && session.players.length > 0 ){
    session.protagonistIndex = 0;
  }

  return { session, removed };
};

export const startGame = ( session ) => {
  if( session.players.length < MIN_PLAYERS_TO_START ){
    const error = new Error(`Se necesitan al menos ${MIN_PLAYERS_TO_START} jugadores para empezar`);
    error.code = "NOT_ENOUGH_PLAYERS";
    throw error;
  }

  if( session.status !== "waiting" ){
    const error = new Error("GAME_ALREADY_STARTED");
    error.code = "ALREADY_STARTED";
    throw error;
  }

  session.status = "playing";
  session.protagonistIndex = 0;
  session.roundNumber = 0;

  return nextRound(session);
};

export const nextRound = ( session ) => {
  // Los jugadores que se unieron a mitad de partida entran en juego a partir de ahora
  session.players.forEach((p) => { p.isSpectator = false; });

  if( session.round ){
    session.protagonistIndex = (session.protagonistIndex + 1) % session.players.length;
  }
  session.roundNumber += 1;

  const protagonist = session.players[session.protagonistIndex];

  session.round = {
    protagonistUserId: protagonist.userId,
    phase: "writing",
    statements: null,
    votes: {},
    voteDeadlineAt: null,
    voteTimeoutHandle: null,
  };

  session.players.forEach((p) => {
    p.status = p.userId === protagonist.userId ? "writing" : "awaiting_statements";
  });

  return session;
};

export const getEligibleVoters = ( session ) => session.players.filter((p) => !p.isSpectator && p.userId !== session.round.protagonistUserId);

export const isRoundFullyVoted = ( session ) => getEligibleVoters(session).every((p) => !!session.round.votes[p.userId]);

export const submitStatements = ( session, { userId, statements } ) => {
  if( !session.round || session.round.phase !== "writing" ){
    const error = new Error("INVALID_PHASE");
    error.code = "INVALID_PHASE";
    throw error;
  }

  if( session.round.protagonistUserId !== userId ){
    const error = new Error("NOT_THE_PROTAGONIST");
    error.code = "NOT_THE_PROTAGONIST";
    throw error;
  }

  if( !Array.isArray(statements) || statements.length !== 3 ){
    const error = new Error("INVALID_STATEMENTS_COUNT");
    error.code = "INVALID_STATEMENTS_COUNT";
    throw error;
  }

  if( statements.some((s) => !s?.text || !s.text.trim()) ){
    const error = new Error("STATEMENT_TEXT_REQUIRED");
    error.code = "STATEMENT_TEXT_REQUIRED";
    throw error;
  }

  const lieCount = statements.filter((s) => !!s.isLie).length;
  if( lieCount !== 1 ){
    const error = new Error("EXACTLY_ONE_LIE_REQUIRED");
    error.code = "EXACTLY_ONE_LIE_REQUIRED";
    throw error;
  }

  session.round.statements = statements.map((s, i) => ({ id: `s${i}`, text: s.text.trim(), isLie: !!s.isLie }));
  session.round.phase = "voting";
  session.round.votes = {};
  session.round.voteDeadlineAt = Date.now() + VOTE_DURATION_MS;

  session.players.forEach((p) => {
    if( p.isSpectator ) return;
    p.status = p.userId === userId ? "focus" : "thinking";
  });

  return session;
};

export const castVote = ( session, { userId, statementId } ) => {
  if( !session.round || session.round.phase !== "voting" ){
    const error = new Error("INVALID_PHASE");
    error.code = "INVALID_PHASE";
    throw error;
  }

  if( session.round.protagonistUserId === userId ){
    const error = new Error("PROTAGONIST_CANNOT_VOTE");
    error.code = "PROTAGONIST_CANNOT_VOTE";
    throw error;
  }

  const player = session.players.find((p) => p.userId === userId);
  if( !player ){
    const error = new Error("PLAYER_NOT_FOUND");
    error.code = "PLAYER_NOT_FOUND";
    throw error;
  }

  if( player.isSpectator ){
    const error = new Error("SPECTATOR_CANNOT_VOTE");
    error.code = "SPECTATOR_CANNOT_VOTE";
    throw error;
  }

  if( session.round.votes[userId] ){
    const error = new Error("ALREADY_VOTED");
    error.code = "ALREADY_VOTED";
    throw error;
  }

  const valid = session.round.statements.some((s) => s.id === statementId);
  if( !valid ){
    const error = new Error("INVALID_STATEMENT");
    error.code = "INVALID_STATEMENT";
    throw error;
  }

  session.round.votes[userId] = statementId;
  player.status = "voted";

  return { session, allVoted: isRoundFullyVoted(session) };
};

export const autoResolveExpiredVotes = ( session ) => {
  const statements = session.round.statements;
  getEligibleVoters(session).forEach((p) => {
    if( session.round.votes[p.userId] ) return;
    const randomStatement = statements[Math.floor(Math.random() * statements.length)];
    session.round.votes[p.userId] = randomStatement.id;
    p.status = "voted";
  });
  return session;
};

export const resolveReveal = ( session ) => {
  if( session.round.voteTimeoutHandle ){
    clearTimeout(session.round.voteTimeoutHandle);
    session.round.voteTimeoutHandle = null;
  }

  session.round.phase = "reveal";

  const lieStatement = session.round.statements.find((s) => s.isLie);
  const protagonist = session.players.find((p) => p.userId === session.round.protagonistUserId);

  let fooledCount = 0;
  getEligibleVoters(session).forEach((p) => {
    const votedId = session.round.votes[p.userId];
    if( votedId === lieStatement.id ){
      p.score += 1;
    }else{
      fooledCount += 1;
    }
  });
  protagonist.score += fooledCount;

  const gameOver = session.players.some((p) => p.score >= session.pointsToWin);

  return { session, fooledCount, gameOver };
};

export const serializeStatementsForVoter = ( statements ) => statements.map(({ id, text }) => ({ id, text }));

export const serializeStatementsForReveal = ( statements ) => statements.map(({ id, text, isLie }) => ({ id, text, isLie }));

export const serializePlayerStatuses = ( session ) => ({
  protagonistUserId: session.round?.protagonistUserId ?? null,
  players: session.players.map((p) => ({
    userId: p.userId, username: p.username, score: p.score,
    isGuest: p.isGuest, isSpectator: !!p.isSpectator, status: p.status,
  })),
});

export const getRandomPrompt = async ( language ) => {
  const lang = (language || "ES").toUpperCase();

  const total = await prisma.vomPrompt.count({ where: { language: lang } });
  if( total === 0 ) return null;

  const skip = Math.floor(Math.random() * total);

  const [ prompt ] = await prisma.vomPrompt.findMany({
    where: { language: lang },
    select: { id: true, language: true, truthOne: true, truthTwo: true, lie: true },
    skip,
    take: 1,
  });

  return prompt ?? null;
};

export const serializeSessionForPlayer = ( session, userId ) => {
  const round = session.round;
  const isProtagonist = round?.protagonistUserId === userId;

  let statements = null;
  if( round?.statements ){
    if( round.phase === "reveal" || isProtagonist ){
      statements = serializeStatementsForReveal(round.statements);
    }else{
      statements = serializeStatementsForVoter(round.statements);
    }
  }

  return {
    gameType: "V_O_M",
    roomCode: session.roomCode,
    hostId: session.hostId,
    status: session.status,
    pointsToWin: session.pointsToWin,
    maxPlayers: session.maxPlayers,
    roundNumber: session.roundNumber,
    phase: round?.phase ?? null,
    protagonistUserId: round?.protagonistUserId ?? null,
    isProtagonist,
    statements,
    myVote: round?.votes?.[userId] ?? null,
    voteDeadlineAt: round?.voteDeadlineAt ?? null,
    players: session.players.map((p) => ({
      userId: p.userId, username: p.username, score: p.score,
      isGuest: p.isGuest, isJudge: false, isSpectator: !!p.isSpectator, status: p.status,
    })),
  };
};