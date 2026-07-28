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

export type GameType = "MALAS_PERSONAS" | "V_O_M";

export interface Room {
  id: string;
  code: string;
  name?: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
  isActive: boolean;
  maxPlayers: number;
  pointsToWin: number;
  gameType: GameType;
  createdAt: string;
  finishedAt?: string;
  deck: { id: string; name: string; language: string } | null;
}

export interface Card {
  id: string;
  type: "BLACK" | "WHITE";
  text: string;
}

export interface Player {
  userId: string;
  username: string;
  score: number;
  isGuest: boolean;
  isJudge: boolean;
  isSpectator: boolean;
  cardCount?: number;
}

export interface GameState {
  roomCode: string;
  hostId: string;
  status: "waiting" | "playing" | "finished";
  pointsToWin: number;
  maxPlayers: number;
  judge: { userId: string; username: string } | null;
  currentBlackCard: Card | null;
  players: Player[];
  hand: Card[];
  hasRedrawn: boolean;
  playedCount: number;
}

export interface PlayedCard {
  userId: string;
  username: string;
  card: Card;
}

// Verdad o Mentira

export type VomPlayerStatus = "idle" | "writing" | "awaiting_statements" | "focus" | "thinking" | "voted" | "spectator";

export interface VomPlayer {
  userId: string;
  username: string;
  score: number;
  isGuest: boolean;
  isSpectator: boolean;
  status: VomPlayerStatus;
}

export interface VomStatement {
  id: string;
  text: string;
  isLie?: boolean;
}

export interface VomVote {
  userId: string;
  username: string;
  statementId: string;
}

export type VomPhase =
  | { kind: "loading" }
  | { kind: "writing"; isProtagonist: boolean }
  | { kind: "voting"; statements: VomStatement[]; voteDeadlineAt: number; isProtagonist: boolean; myVote: string | null }
  | { kind: "reveal"; statements: VomStatement[]; votes: VomVote[]; fooledCount: number }
  | { kind: "gameOver"; winner: { userId: string; username: string; score: number } };

export interface VomPrompt {
  id: string;
  language: "ES" | "EN";
  truthOne: string;
  truthTwo: string;
  lie: string;
}