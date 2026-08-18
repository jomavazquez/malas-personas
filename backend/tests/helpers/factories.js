import { registerUser } from "../../src/modules/auth/auth.service.js";
import { createDeck, addCardToDeck } from "../../src/modules/decks/decks.service.js";
import { createRoom } from "../../src/modules/rooms/rooms.service.js";

let counter = 0;
// Unique-per-call suffix so sequential fixtures in the same test (or across tests
// sharing the DB within a file) never collide on the unique email/username constraints.
const uniq = () => `${Date.now()}-${counter++}`;

// Creates a real User row via the actual registerUser service (real bcrypt hashing),
// so auth-flow tests exercise the genuine password path, not a shortcut.
export const makeUser = async (overrides = {}) => {
  const id = uniq();
  const { user, token } = await registerUser({
    email: overrides.email ?? `user-${id}@example.com`,
    username: overrides.username ?? `user_${id}`,
    password: overrides.password ?? "password123",
  });
  return { ...user, token };
};

// Creates a Deck (optionally owned by a user, otherwise an "official" deck) with
// `cardCount` WHITE cards and one BLACK card by default — enough for a Malas
// Personas round to actually be playable.
export const makeDeck = async ({ userId = null, name, language = "ES", cardCount = 3 } = {}) => {
  const id = uniq();
  const deck = await createDeck(userId, { name: name ?? `Deck ${id}`, language });

  await addCardToDeck(userId, deck.id, { type: "BLACK", text: `Black card ____ ${id}` });
  for (let i = 0; i < cardCount; i++) {
    await addCardToDeck(userId, deck.id, { type: "WHITE", text: `White card ${id}-${i}` });
  }

  return deck;
};

// Creates a Room hosted by `hostId`. Defaults to MALAS_PERSONAS with a freshly
// created deck unless a deckId is supplied or gameType is V_O_M (no deck needed).
export const makeRoom = async (hostId, overrides = {}) => {
  const gameType = overrides.gameType ?? "MALAS_PERSONAS";
  let deckId = overrides.deckId;
  if (gameType === "MALAS_PERSONAS" && !deckId) {
    const deck = await makeDeck({ userId: hostId });
    deckId = deck.id;
  }

  const id = uniq();
  return createRoom(hostId, {
    name: overrides.name ?? `Room ${id}`,
    gameType,
    deckId,
    maxPlayers: overrides.maxPlayers ?? 10,
    pointsToWin: overrides.pointsToWin ?? 5,
  });
};