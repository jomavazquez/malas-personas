import { getDecks, getDeckById } from "./decks.service.js";

export const handleGetDecks = async (req, res, next) => {
  try {
    const decks = await getDecks();
    res.json({ success: true, decks });
  } catch (err) {
    next(err);
  }
};

export const handleGetDeckById = async (req, res, next) => {
  try {
    const deck = await getDeckById(req.params.id);
    res.json({ success: true, deck });
  } catch (err) {
    next(err);
  }
};
