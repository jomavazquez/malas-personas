import prisma from "../../src/config/database.js";

// Deletes all rows from every table in FK-safe order (children before parents),
// derived from prisma/schema.prisma:
//   Card    -> deckId  -> Deck
//   Room    -> hostId  -> User, deckId -> Deck
//   Deck    -> userId  -> User (optional)
//   VomPrompt has no relations — safe to clear at any point.
// Called from `afterEach` in integration tests to give each test a clean slate.
export const resetDb = async () => {
  await prisma.card.deleteMany();
  await prisma.room.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vomPrompt.deleteMany();
};