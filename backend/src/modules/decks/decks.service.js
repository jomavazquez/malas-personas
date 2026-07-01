import prisma from "../../config/database.js";

const PAGE_SIZE = 10;

// ── Official Decks (userId null)
export const getDecks = async () => {
  return prisma.deck.findMany({
    where: { userId: null },
    select: { id: true, name: true, language: true, _count: { select: { cards: true } } },
    orderBy: { name: "asc" },
  });
};

// ── User's Decks
export const getMyDecks = async( userId ) => {
  return prisma.deck.findMany({
    where: { userId },
    select: { id: true, name: true, language: true, _count: { select: { cards: true } } },
    orderBy: { createdAt: "desc" },
  });
};

// ── Cards of a deck with pagination and filters
export const getDeckCards = async( userId, deckId, { page = 1, type, search } ) => {
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if( !deck ) throw Object.assign(new Error("DECK_NOT_FOUND"), { status: 404 });
  if( deck.userId !== userId ) throw Object.assign(new Error("UNAUTHORIZED"), { status: 403 });

  const where = {
    deckId,
    ...(type && { type }),
    ...(search && { text: { contains: search, mode: "insensitive" } }),
  };

  const [ cards, total, blackCount, whiteCount ] = await Promise.all([
    prisma.card.findMany({
      where,
      select: { id: true, type: true, text: true },
      orderBy: [{ type: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.card.count({ where }),
    prisma.card.count({ where: { deckId } }),
    prisma.card.count({ where: { deckId, type: "WHITE" } }),
  ]);

  const blacks = blackCount - whiteCount;

  return { cards, total, page, pageSize: PAGE_SIZE, pages: Math.ceil(total / PAGE_SIZE), blackCount: blacks, whiteCount };
};

// ── Create User's Deck
export const createDeck = async( userId, { name, language } ) => {
  return prisma.deck.create({
    data: { name, language, userId },
    select: { id: true, name: true, language: true, _count: { select: { cards: true } } },
  });
};

// ── Add Card to User's Deck
export const addCardToDeck = async( userId, deckId, { type, text } ) => {
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if( !deck ) throw Object.assign(new Error("DECK_NOT_FOUND"), { status: 404 });
  if( deck.userId !== userId ) throw Object.assign(new Error("UNAUTHORIZED"), { status: 403 });
  return prisma.card.create({ data: { type, text, deckId }, select: { id: true, type: true, text: true } });
};

// ── Edit card
export const updateCard = async( userId, cardId, { text } ) => {
  const card = await prisma.card.findUnique({ where: { id: cardId }, include: { deck: true } });
  if( !card ) throw Object.assign(new Error("CARD_NOT_FOUND"), { status: 404 });
  if( card.deck.userId !== userId ) throw Object.assign(new Error("UNAUTHORIZED"), { status: 403 });
  return prisma.card.update({ where: { id: cardId }, data: { text }, select: { id: true, type: true, text: true } });
};

// ── Delete card
export const deleteCard = async( userId, cardId ) => {
  const card = await prisma.card.findUnique({ where: { id: cardId }, include: { deck: true } });
  if( !card ) throw Object.assign(new Error("CARD_NOT_FOUND"), { status: 404 });
  if( card.deck.userId !== userId ) throw Object.assign(new Error("UNAUTHORIZED"), { status: 403 });
  return prisma.card.delete({ where: { id: cardId } });
};

// ── Delete Deck
export const deleteDeck = async( userId, deckId ) => {
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if( !deck ) throw Object.assign(new Error("DECK_NOT_FOUND"), { status: 404 });
  if( deck.userId !== userId ) throw Object.assign(new Error("UNAUTHORIZED"), { status: 403 });
  await prisma.card.deleteMany({ where: { deckId } });
  return prisma.deck.delete({ where: { id: deckId } });
};

export const getDeckById = async( id ) => {
  const deck = await prisma.deck.findUnique({
    where: { id },
    select: { id: true, name: true, language: true, _count: { select: { cards: true } } },
  });
  if( !deck ) throw Object.assign(new Error("DECK_NOT_FOUND"), { status: 404 });
  return deck;
};