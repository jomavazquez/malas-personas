import prisma from "../../config/database.js";

export const getDecks = async () => {
  return prisma.deck.findMany({
    select: {
      id: true,
      name: true,
      language: true,
      _count: { select: { cards: true } },
    },
    orderBy: { name: "asc" },
  });
};

export const getDeckById = async (id) => {
  const deck = await prisma.deck.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      language: true,
      _count: { select: { cards: true } },
    },
  });

  if (!deck) {
    const error = new Error("Mazo no encontrado");
    error.status = 404;
    throw error;
  }

  return deck;
};
