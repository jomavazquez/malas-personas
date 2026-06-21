import prisma from "../../config/database.js";
import { getSession, deleteSession } from "./game.state.js";
import {
  buildSession, addPlayer, removePlayer,
  startGame, nextRound, playCard, pickWinner,
  serializeSessionForPlayer, serializeReveal,
} from "./game.service.js";

// Map<socketId, { roomCode, userId, username }>
const socketMeta = new Map();

export const registerGameHandlers = (io, socket) => {

  // ─── room:join ───────────────────────────────────────────────────────────────
  socket.on("room:join", async ({ roomCode, userId, username, isGuest }, callback) => {
    try {
      const code = roomCode.toUpperCase();

      let session = getSession(code);

      if (!session) {
        const room = await prisma.room.findUnique({
          where: { code },
          select: { id: true, code: true, hostId: true, deckId: true, maxPlayers: true, pointsToWin: true, isActive: true },
        });

        if (!room || !room.isActive) {
          return callback({ error: "Sala no encontrada o inactiva" });
        }

        session = await buildSession(room);
      }

      if (session.status === "finished") {
        return callback({ error: "La partida ha terminado" });
      }

      const { session: updated, player, isReconnect } = addPlayer(session, {
        socketId: socket.id, userId, username, isGuest,
      });

      socketMeta.set(socket.id, { roomCode: code, userId, username });
      socket.join(code);

      callback({ success: true, state: serializeSessionForPlayer(updated, userId), isReconnect });

      if (!isReconnect) {
        socket.to(code).emit("room:playerJoined", {
          userId, username, isGuest: !!isGuest,
          playerCount: updated.players.length,
        });
      }
    } catch (err) {
      callback({ error: err.message });
    }
  });

  // ─── game:start ──────────────────────────────────────────────────────────────
  socket.on("game:start", async ({ roomCode }, callback) => {
    try {
      const code = roomCode.toUpperCase();
      const session = getSession(code);
      if (!session) return callback({ error: "Sesión no encontrada" });

      const meta = socketMeta.get(socket.id);
      if (session.hostId !== meta?.userId) {
        return callback({ error: "Solo el anfitrión puede iniciar la partida" });
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
    } catch (err) {
      callback({ error: err.message });
    }
  });

  // ─── round:playCard ──────────────────────────────────────────────────────────
  socket.on("round:playCard", ({ roomCode, cardId }, callback) => {
    try {
      const code = roomCode.toUpperCase();
      const session = getSession(code);
      if (!session) return callback({ error: "Sesión no encontrada" });

      const meta = socketMeta.get(socket.id);
      if (!meta) return callback({ error: "No identificado" });

      const { session: updated, card, allPlayed } = playCard(session, { userId: meta.userId, cardId });

      callback({ success: true, card });

      const player = updated.players.find((p) => p.userId === meta.userId);
      socket.emit("hand:update", { hand: player.hand });

      io.to(code).emit("round:cardPlayed", {
        playedCount: updated.playedCards.length,
        totalNeeded: updated.players.length - 1,
      });

      if (allPlayed) {
        io.to(code).emit("round:reveal", { cards: serializeReveal(updated) });
      }
    } catch (err) {
      callback({ error: err.message });
    }
  });

  // ─── round:pickWinner ────────────────────────────────────────────────────────
  socket.on("round:pickWinner", ({ roomCode, winnerUserId }, callback) => {
    try {
      const code = roomCode.toUpperCase();
      const session = getSession(code);
      if (!session) return callback({ error: "Sesión no encontrada" });

      const meta = socketMeta.get(socket.id);
      if (!meta) return callback({ error: "No identificado" });

      const { session: updated, winner, winnerPlay, gameOver } = pickWinner(session, {
        judgeUserId: meta.userId, winnerUserId,
      });

      io.to(code).emit("round:winner", {
        winner: { userId: winner.userId, username: winner.username, score: winner.score },
        winningCard: winnerPlay.card,
        scores: updated.players.map((p) => ({ userId: p.userId, username: p.username, score: p.score })),
      });

      if (gameOver) {
        io.to(code).emit("game:over", {
          winner: { userId: winner.userId, username: winner.username, score: winner.score },
        });

        prisma.room.update({
          where: { code },
          data: { isActive: false, status: "FINISHED", finishedAt: new Date() },
        }).catch(console.error);

        deleteSession(code);
        return callback({ success: true });
      }

      const { blackCard } = nextRound(updated);
      const newJudge = updated.players[updated.judgeIndex];

      io.to(code).emit("round:new", {
        blackCard,
        judge: { userId: newJudge.userId, username: newJudge.username },
      });

      callback({ success: true });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  // ─── room:leave ──────────────────────────────────────────────────────────────
  socket.on("room:leave", ({ roomCode }, callback) => {
    handlePlayerLeave(io, socket, roomCode?.toUpperCase());
    callback?.({ success: true });
  });

  // ─── disconnect ──────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const meta = socketMeta.get(socket.id);
    if (meta) handlePlayerLeave(io, socket, meta.roomCode);
  });
};

const handlePlayerLeave = (io, socket, roomCode) => {
  if (!roomCode) return;
  const session = getSession(roomCode);
  const meta = socketMeta.get(socket.id);
  if (!session || !meta) return;

  const { session: updated, removed } = removePlayer(session, socket.id);
  socketMeta.delete(socket.id);
  socket.leave(roomCode);

  if (!removed) return;

  io.to(roomCode).emit("room:playerLeft", {
    userId: removed.userId,
    username: removed.username,
    playerCount: updated.players.length,
  });

  if (updated.players.length === 0) deleteSession(roomCode);
};