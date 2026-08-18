import prisma from "../../config/database.js";
import { getSession, deleteSession, getSocketMeta } from "./games.state.js";
import { startGame, nextRound, submitStatements, castVote, autoResolveExpiredVotes, resolveReveal, isRoundFullyVoted, serializeStatementsForVoter, serializeStatementsForReveal, serializePlayerStatuses } from "./v_o_m.service.js";

// Optional env overrides let integration tests shrink these waits — see backend/env.example.
const ROUND_BREATHER_MS = Number(process.env.VOM_ROUND_BREATHER_MS) || 10000;
const VOTE_DURATION_MS = Number(process.env.VOM_VOTE_DURATION_MS) || 60000;

const emitRoundNew = ( io, code, session ) => {
  const protagonist = session.players.find((p) => p.userId === session.round.protagonistUserId);
  io.to(code).emit("vom:round:new", {
    roundNumber: session.roundNumber,
    protagonist: { userId: protagonist.userId, username: protagonist.username },
    phase: "writing",
  });
};

const finishVoting = ( io, code, session ) => {
  const { fooledCount, gameOver } = resolveReveal(session);
  const nextRoundAt = Date.now() + ROUND_BREATHER_MS;

  io.to(code).emit("vom:round:reveal", {
    statements: serializeStatementsForReveal(session.round.statements),
    votes: Object.entries(session.round.votes).map(([ userId, statementId ]) => {
      const player = session.players.find((p) => p.userId === userId);
      return { userId, username: player?.username, statementId };
    }),
    scores: session.players.map((p) => ({
      userId: p.userId, username: p.username, score: p.score, isGuest: p.isGuest, isSpectator: !!p.isSpectator,
    })),
    protagonistUserId: session.round.protagonistUserId,
    fooledCount,
    gameOver,
    nextRoundAt,
  });
  io.to(code).emit("vom:playerStatus", serializePlayerStatuses(session));

  if( gameOver ){
    if( session.players.length === 0 ){ deleteSession(code); return; }
    const winner = session.players.reduce((max, p) => (p.score > max.score ? p : max), session.players[0]);
    setTimeout(() => {
      try{
        if( session.players.length === 0 ) return;
        io.to(code).emit("vom:game:over", { winner: { userId: winner.userId, username: winner.username, score: winner.score } });
      }finally{
        deleteSession(code);
      }
    }, ROUND_BREATHER_MS);
    return;
  }

  setTimeout(() => {
    try{
      if( session.players.length === 0 ){ deleteSession(code); return; }
      nextRound(session);
      emitRoundNew(io, code, session);
      io.to(code).emit("vom:playerStatus", serializePlayerStatuses(session));
    }catch( err ){
      console.error("VoM round-advance timer failed:", err);
    }
  }, ROUND_BREATHER_MS);
};

const handleVoteTimeout = ( io, code ) => {
  try{
    const session = getSession(code);
    if( !session || session.gameType !== "V_O_M" ) return;
    if( !session.round || session.round.phase !== "voting" ) return;
    if( session.players.length === 0 ){ deleteSession(code); return; }

    autoResolveExpiredVotes(session);
    io.to(code).emit("vom:playerStatus", serializePlayerStatuses(session));
    finishVoting(io, code, session);
  }catch( err ){
    console.error("VoM vote-timeout handler failed:", err);
  }
};

// Called from the shared handler from room:leave/disconnect when the session is Verdad o Mentira
export const handleVomPlayerLeft = ( io, code, session, removedUserId ) => {
  try{
    if( session.status !== "playing" || !session.round ) return;

    if( session.round.protagonistUserId === removedUserId ){
      if( session.round.voteTimeoutHandle ) clearTimeout(session.round.voteTimeoutHandle);
      io.to(code).emit("vom:round:aborted", { reason: "PROTAGONIST_LEFT" });
      if( session.players.length === 0 ) return;
      nextRound(session);
      emitRoundNew(io, code, session);
      io.to(code).emit("vom:playerStatus", serializePlayerStatuses(session));
      return;
    }

    if( session.round.phase === "voting" && isRoundFullyVoted(session) ){
      finishVoting(io, code, session);
    }
  }catch( err ){
    console.error("VoM player-left handler failed:", err);
  }
};

export const registerVerdadOMentiraHandlers = ( io, socket ) => {

  // ─── vom:start ────────────────────────────────────────────────────────────────
  socket.on("vom:start", async( { roomCode }, callback ) => {
    try{
      const code = roomCode.toUpperCase();
      const session = getSession(code);
      if( !session || session.gameType !== "V_O_M" ) return callback({ error: "SESSION_NOT_FOUND" });

      const meta = getSocketMeta(socket.id);
      if( session.hostId !== meta?.userId ){
        return callback({ error: "ONLY_HOST_CAN_INITIATE_A_GAME" });
      }

      startGame(session);

      await prisma.room.update({ where: { code }, data: { status: "PLAYING" } }).catch(console.error);

      io.to(code).emit("game:started", { gameType: "V_O_M", pointsToWin: session.pointsToWin });
      emitRoundNew(io, code, session);
      io.to(code).emit("vom:playerStatus", serializePlayerStatuses(session));

      callback({ success: true });
    }catch( err ){
      callback({ error: err.message });
    }
  });

  // ─── vom:statements:submit ──────────────────────────────────────────────────────
  socket.on("vom:statements:submit", ({ roomCode, statements }, callback ) => {
    try{
      const code = roomCode.toUpperCase();
      const session = getSession(code);
      if( !session || session.gameType !== "V_O_M" ) return callback({ error: "SESSION_NOT_FOUND" });

      const meta = getSocketMeta(socket.id);
      if( !meta ) return callback({ error: "NOT_IDENTIFIED" });

      submitStatements(session, { userId: meta.userId, statements });

      callback({ success: true });

      io.to(code).emit("vom:round:voting", {
        statements: serializeStatementsForVoter(session.round.statements),
        voteDeadlineAt: session.round.voteDeadlineAt,
      });
      io.to(code).emit("vom:playerStatus", serializePlayerStatuses(session));

      session.round.voteTimeoutHandle = setTimeout(() => handleVoteTimeout(io, code), VOTE_DURATION_MS);
    }catch( err ){
      callback({ error: err.message });
    }
  });

  // ─── vom:vote:cast ───────────────────────────────────────────────────────────
  socket.on("vom:vote:cast", ({ roomCode, statementId }, callback ) => {
    try{
      const code = roomCode.toUpperCase();
      const session = getSession(code);
      if( !session || session.gameType !== "V_O_M" ) return callback({ error: "SESSION_NOT_FOUND" });

      const meta = getSocketMeta(socket.id);
      if( !meta ) return callback({ error: "NOT_IDENTIFIED" });

      const { allVoted } = castVote(session, { userId: meta.userId, statementId });

      callback({ success: true });
      io.to(code).emit("vom:playerStatus", serializePlayerStatuses(session));

      if( allVoted ) finishVoting(io, code, session);
    }catch( err ){
      callback({ error: err.message });
    }
  });
};