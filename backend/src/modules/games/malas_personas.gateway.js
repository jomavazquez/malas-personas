import prisma from "../../config/database.js";
import { getSession, deleteSession, getSocketMeta, setSocketMeta, deleteSocketMeta, setDisconnectTimer, clearDisconnectTimer } from "./games.state.js";
import { buildSession, addPlayer, removePlayer, startGame, nextRound, playCard, pickWinner, redrawHand, serializeSessionForPlayer, serializeReveal } from "./malas_personas.service.js";
import { buildSession as buildVomSession, addPlayer as addVomPlayer, removePlayer as removeVomPlayer, serializeSessionForPlayer as serializeVomSessionForPlayer } from "./v_o_m.service.js";
import { handleVomPlayerLeft } from "./v_o_m.gateway.js";

export { getSocketMeta };

// Grace period before removing a player from the room after a socket drop (unstable network).
// If they reconnect and do room:join again within this time, they recover their spot (score, hand, etc).
// Applies to both game types (this handler is shared). Optional env override for tests — see backend/env.example.
const DISCONNECT_GRACE_MS = Number(process.env.GAME_DISCONNECT_GRACE_MS) || 20000;

// Pause between the winner reveal and the next round starting, so players can see the round result.
// Optional env override for tests — see backend/env.example.
const MP_ROUND_BREATHER_MS = Number(process.env.MP_ROUND_BREATHER_MS) || 2000;

export const registerGameHandlers = ( io, socket ) => {

  // ─── room:join ───────────────────────────────────────────────────────────────
  socket.on("room:join", async({ roomCode, userId, username, isGuest }, callback ) => {
    try {
      const code = roomCode.toUpperCase();

      let session = getSession(code);

      if( !session ){
        const room = await prisma.room.findUnique({
          where: { code },
          select: { id: true, code: true, hostId: true, deckId: true, maxPlayers: true, pointsToWin: true, isActive: true, gameType: true },
        });

        if( !room || !room.isActive ){
          return callback({ error: "ROOM_NOT_FOUND_OR_INACTIVE" });
        }
        session = room.gameType === "V_O_M" ? buildVomSession(room) : await buildSession(room);
      }

      if( session.status === "finished" ){
        return callback({ error: "GAME_IS_OVER" });
      }

      // Determine isGuest on the backend by querying the DB
      const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }).catch(() => null);
      const resolvedIsGuest = !userRecord;

      const isVom = session.gameType === "V_O_M";
      const { session: updated, player, isReconnect } = isVom
        ? addVomPlayer(session, { socketId: socket.id, userId, username, isGuest: resolvedIsGuest })
        : addPlayer(session, { socketId: socket.id, userId, username, isGuest: resolvedIsGuest });

      setSocketMeta(socket.id, { roomCode: code, userId, username });
      socket.join(code);

      // If they reconnected in time, cancel the removal scheduled by the previous disconnect
      if( isReconnect ) clearDisconnectTimer(`${code}:${userId}`);

      const state = isVom ? serializeVomSessionForPlayer(updated, userId) : serializeSessionForPlayer(updated, userId);
      callback({ success: true, state, isReconnect });

      if( !isReconnect ){
        socket.to(code).emit("room:playerJoined", {
          userId, username, isGuest: resolvedIsGuest,
          isSpectator: player.isSpectator,
          playerCount: updated.players.length,
        });
      }
    }catch( err ){
      callback({ error: err.message });
    }
  });

  // ─── game:start ──────────────────────────────────────────────────────────────
  socket.on("game:start", async( { roomCode }, callback ) => {
    try{
      const code = roomCode.toUpperCase();
      const session = getSession(code);
      if( !session ) return callback({ error: "SESSION_NOT_FOUND" });

      const meta = getSocketMeta(socket.id);
      if( session.hostId !== meta?.userId ){
        return callback({ error: "ONLY_HOST_CAN_INITIATE_A_GAME" });
      }

      const { session: updated, blackCard } = startGame(session);
      const judge = updated.players[0];

      // Persist status to DB
      await prisma.room.update({
        where: { code },
        data: { status: "PLAYING" },
      }).catch(console.error);

      io.to(code).emit("game:started", {
        judge: { userId: judge.userId, username: judge.username },
        pointsToWin: updated.pointsToWin,
      });

      io.to(code).emit("round:new", { blackCard });

      updated.players.forEach((p) => {
        io.to(p.socketId).emit("hand:update", { hand: p.hand });
      });

      callback({ success: true });
    }catch( err ){
      callback({ error: err.message });
    }
  });

  // ─── round:playCard ──────────────────────────────────────────────────────────
  socket.on("round:playCard", ({ roomCode, cardId }, callback ) => {
    try{
      const code = roomCode.toUpperCase();
      const session = getSession(code);
      if( !session ) return callback({ error: "SESSION_NOT_FOUND" });

      const meta = getSocketMeta(socket.id);
      if( !meta ) return callback({ error: "NO_IDENTIFIED" });

      const { session: updated, card, allPlayed, totalNeeded } = playCard(session, { userId: meta.userId, cardId });

      callback({ success: true, card });

      io.to(code).emit("round:cardPlayed", {
        playedCount: updated.playedCards.length,
        totalNeeded,
        card: { id: card.id, text: card.text },
      });

      if( allPlayed ){
        io.to(code).emit("round:reveal", { cards: serializeReveal(updated) });
      }
    }catch( err ){
      callback({ error: err.message });
    }
  });

  // ─── hand:redraw ─────────────────────────────────────────────────────────────
  socket.on("hand:redraw", ({ roomCode }, callback ) => {
    try{
      const code = roomCode.toUpperCase();
      const session = getSession(code);
      if( !session ) return callback({ error: "SESSION_NOT_FOUND" });

      const meta = getSocketMeta(socket.id);
      if( !meta ) return callback({ error: "NO_IDENTIFIED" });

      const { hand } = redrawHand(session, { userId: meta.userId });

      callback({ success: true, hand });
    }catch( err ){
      callback({ error: err.message });
    }
  });

  // ─── round:pickWinner ────────────────────────────────────────────────────────
  socket.on("round:pickWinner", ({ roomCode, winnerUserId }, callback ) => {
    try{
      const code = roomCode.toUpperCase();
      const session = getSession(code);
      if( !session ) return callback({ error: "SESSION_NOT_FOUND" });

      const meta = getSocketMeta(socket.id);
      if (!meta) return callback({ error: "NO_IDENTIFIED" });

      const { session: updated, winner, winnerPlay, gameOver } = pickWinner(session, {
        judgeUserId: meta.userId, winnerUserId,
      });

      io.to(code).emit("round:winner", {
        winner: { userId: winner.userId, username: winner.username, score: winner.score },
        winningCard: winnerPlay.card,
        scores: updated.players.map((p) => ({
          userId: p.userId,
          username: p.username,
          score: p.score,
          isGuest: p.isGuest,
          isJudge: p.userId === updated.players[updated.judgeIndex]?.userId,
          isSpectator: !!p.isSpectator,
        })),
      });

      if( gameOver ){
        io.to(code).emit("game:over", {
          winner: { userId: winner.userId, username: winner.username, score: winner.score },
        });

        // The room stays active — the host can start a new game
        deleteSession(code);
        return callback({ success: true });
      }

      const { blackCard } = nextRound(updated);
      const newJudge = updated.players[updated.judgeIndex];

      setTimeout(() => {
        io.to(code).emit("round:new", {
          blackCard,
          judge: { userId: newJudge.userId, username: newJudge.username },
          players: updated.players.map((p) => ({
            userId: p.userId,
            username: p.username,
            score: p.score,
            isGuest: p.isGuest,
            isJudge: p.userId === newJudge.userId,
            isSpectator: !!p.isSpectator,
          })),
        });

        updated.players.forEach((p) => {
          io.to(p.socketId).emit("hand:update", { hand: p.hand });
        });
      }, MP_ROUND_BREATHER_MS);

      callback({ success: true });
    }catch( err ){
      callback({ error: err.message });
    }
  });

  // ─── room:leave ──────────────────────────────────────────────────────────────
  // Explicit leave (the player closes the room on purpose): removed instantly.
  socket.on("room:leave", ({ roomCode }, callback ) => {
    const code = roomCode?.toUpperCase();
    const meta = getSocketMeta(socket.id);
    if( meta ) clearDisconnectTimer(`${code}:${meta.userId}`);
    handlePlayerLeave(io, code, socket.id);
    deleteSocketMeta(socket.id);
    socket.leave(code);
    callback?.({ success: true });
  });

  // ─── disconnect ──────────────────────────────────────────────────────────────
  // Socket drop (possibly a momentary network outage): a grace period is given
  // before removing the player, in case they reconnect and do room:join again in time.
  socket.on("disconnect", () => {
    const meta = getSocketMeta(socket.id);
    if( !meta ) return;
    deleteSocketMeta(socket.id);

    const { roomCode, userId } = meta;
    const key = `${roomCode}:${userId}`;
    const timeoutId = setTimeout(() => {
      clearDisconnectTimer(key);
      const session = getSession(roomCode);
      if( !session ) return;
      const player = session.players.find((p) => p.userId === userId);
      // If the player already reconnected, their socketId will have changed: don't remove them.
      if( !player || player.socketId !== socket.id ) return;
      handlePlayerLeave(io, roomCode, socket.id);
    }, DISCONNECT_GRACE_MS);
    setDisconnectTimer(key, timeoutId);
  });
};

const handlePlayerLeave = ( io, roomCode, socketId ) => {
  if( !roomCode ) return;
  const session = getSession(roomCode);
  if( !session ) return;

  const isVom = session.gameType === "V_O_M";
  const { session: updated, removed } = isVom ? removeVomPlayer(session, socketId) : removePlayer(session, socketId);

  if( !removed ) return;

  io.to(roomCode).emit("room:playerLeft", {
    userId: removed.userId,
    username: removed.username,
    playerCount: updated.players.length,
  });

  if( updated.players.length === 0 ){
    deleteSession(roomCode);
    return;
  }

  if( isVom ) handleVomPlayerLeft(io, roomCode, updated, removed.userId);
};