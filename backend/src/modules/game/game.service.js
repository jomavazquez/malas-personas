import prisma from "../../config/database.js";
import { setSession } from "./game.state.js";

const HAND_SIZE = 5;
const MIN_PLAYERS_TO_START = 2;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const dealCards = (whiteDeck, count) => {
  const dealt = whiteDeck.splice(0, count);
  return { dealt, whiteDeck };
};

export const buildSession = async (room) => {
  const cards = await prisma.card.findMany({
    where: { deckId: room.deckId },
    select: { id: true, type: true, text: true, blanks: true },
  });

  const blackDeck = shuffle(cards.filter((c) => c.type === "BLACK"));
  const whiteDeck = shuffle(cards.filter((c) => c.type === "WHITE"));

  const session = {
    roomCode: room.code,
    roomId: room.id,
    hostId: room.hostId,
    deckId: room.deckId,
    maxPlayers: room.maxPlayers,
    pointsToWin: room.pointsToWin,
    status: "waiting",
    players: [],
    judgeIndex: 0,
    currentBlackCard: null,
    playedCards: [],
    blackDeck,
    whiteDeck,
  };

  setSession(room.code, session);
  return session;
};

export const addPlayer = (session, { socketId, userId, username, isGuest }) => {
  const existing = session.players.find((p) => p.userId === userId);
  if (existing) {
    existing.socketId = socketId;
    return { session, player: existing, isReconnect: true };
  }

  if (session.players.length >= session.maxPlayers) {
    const error = new Error("La sala está llena");
    error.code = "ROOM_FULL";
    throw error;
  }

  const { dealt, whiteDeck } = dealCards(session.whiteDeck, HAND_SIZE);
  session.whiteDeck = whiteDeck;

  const player = { socketId, userId, username, isGuest: !!isGuest, hand: dealt, score: 0 };
  session.players.push(player);

  return { session, player, isReconnect: false };
};

export const removePlayer = (session, socketId) => {
  const index = session.players.findIndex((p) => p.socketId === socketId);
  if (index === -1) return { session, removed: null };

  const [removed] = session.players.splice(index, 1);

  if (session.judgeIndex >= session.players.length && session.players.length > 0) {
    session.judgeIndex = 0;
  }

  return { session, removed };
};

export const startGame = (session) => {
  if (session.players.length < MIN_PLAYERS_TO_START) {
    const error = new Error(`Se necesitan al menos ${MIN_PLAYERS_TO_START} jugadores para empezar`);
    error.code = "NOT_ENOUGH_PLAYERS";
    throw error;
  }

  if (session.status !== "waiting") {
    const error = new Error("La partida ya ha empezado");
    error.code = "ALREADY_STARTED";
    throw error;
  }

  session.status = "playing";
  session.judgeIndex = 0;

  return nextRound(session);
};

export const nextRound = (session) => {
  if (session.blackDeck.length === 0) {
    session.status = "finished";
    return { session, blackCard: null, finished: true };
  }

  const blackCard = session.blackDeck.shift();
  session.currentBlackCard = blackCard;
  session.playedCards = [];

  return { session, blackCard, finished: false };
};

export const playCard = (session, { userId, cardId }) => {
  const player = session.players.find((p) => p.userId === userId);
  if (!player) {
    const error = new Error("Jugador no encontrado");
    error.code = "PLAYER_NOT_FOUND";
    throw error;
  }

  const judge = session.players[session.judgeIndex];
  if (judge.userId === userId) {
    const error = new Error("El juez no puede jugar una carta");
    error.code = "JUDGE_CANNOT_PLAY";
    throw error;
  }

  if (session.playedCards.find((p) => p.userId === userId)) {
    const error = new Error("Ya has jugado una carta esta ronda");
    error.code = "ALREADY_PLAYED";
    throw error;
  }

  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    const error = new Error("Carta no encontrada en tu mano");
    error.code = "CARD_NOT_IN_HAND";
    throw error;
  }

  const [card] = player.hand.splice(cardIndex, 1);
  session.playedCards.push({ userId, username: player.username, card });

  const { dealt, whiteDeck } = dealCards(session.whiteDeck, 1);
  session.whiteDeck = whiteDeck;
  player.hand.push(...dealt);

  const nonJudgePlayers = session.players.filter((p) => p.userId !== judge.userId);
  const allPlayed = nonJudgePlayers.every((p) =>
    session.playedCards.find((pc) => pc.userId === p.userId)
  );

  return { session, card, allPlayed };
};

export const pickWinner = (session, { judgeUserId, winnerUserId }) => {
  const judge = session.players[session.judgeIndex];
  if (judge.userId !== judgeUserId) {
    const error = new Error("Solo el juez puede elegir al ganador");
    error.code = "NOT_THE_JUDGE";
    throw error;
  }

  const winnerPlay = session.playedCards.find((p) => p.userId === winnerUserId);
  if (!winnerPlay) {
    const error = new Error("Jugador ganador no encontrado");
    error.code = "WINNER_NOT_FOUND";
    throw error;
  }

  const winner = session.players.find((p) => p.userId === winnerUserId);
  winner.score += 1;

  const gameOver = winner.score >= session.pointsToWin;
  session.judgeIndex = (session.judgeIndex + 1) % session.players.length;

  return { session, winner, winnerPlay, gameOver };
};

export const serializeSessionForPlayer = (session, userId) => ({
  roomCode: session.roomCode,
  status: session.status,
  pointsToWin: session.pointsToWin,
  maxPlayers: session.maxPlayers,
  judge: session.players[session.judgeIndex]
    ? { userId: session.players[session.judgeIndex].userId, username: session.players[session.judgeIndex].username }
    : null,
  currentBlackCard: session.currentBlackCard,
  players: session.players.map((p) => ({
    userId: p.userId,
    username: p.username,
    score: p.score,
    isGuest: p.isGuest,
    isJudge: p.userId === session.players[session.judgeIndex]?.userId,
  })),
  hand: session.players.find((p) => p.userId === userId)?.hand ?? [],
  playedCount: session.playedCards.length,
});

export const serializeReveal = (session) =>
  session.playedCards.map(({ userId, username, card }) => ({ userId, username, card }));
