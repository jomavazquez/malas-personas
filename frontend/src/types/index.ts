export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface Deck {
  id: string;
  name: string;
  language: "ES" | "EN";
  _count: { cards: number };
}

export interface Room {
  id: string;
  code: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
  isActive: boolean;
  maxPlayers: number;
  pointsToWin: number;
  createdAt: string;
  deck: { id: string; name: string; language: string };
}

export interface Card {
  id: string;
  type: "BLACK" | "WHITE";
  text: string;
  blanks: number;
}

export interface Player {
  userId: string;
  username: string;
  score: number;
  isGuest: boolean;
  isJudge: boolean;
  cardCount?: number;
}

export interface GameState {
  roomCode: string;
  status: "waiting" | "playing" | "finished";
  pointsToWin: number;
  maxPlayers: number;
  judge: { userId: string; username: string } | null;
  currentBlackCard: Card | null;
  players: Player[];
  hand: Card[];
  playedCount: number;
}

export interface PlayedCard {
  userId: string;
  username: string;
  card: Card;
}