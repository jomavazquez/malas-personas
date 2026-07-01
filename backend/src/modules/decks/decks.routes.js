import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { handleGetDecks, handleGetDeckById, handleGetMyDecks, handleGetDeckCards, handleCreateDeck, handleAddCard, handleUpdateCard, handleDeleteCard, handleDeleteDeck } from "./decks.controller.js";

const router = Router();

// ── Public
router.get("/", handleGetDecks);
router.get("/:id", handleGetDeckById);

// ── Private
router.get("/my/decks", authMiddleware, handleGetMyDecks);
router.post("/my/decks", authMiddleware, handleCreateDeck);
router.delete("/my/decks/:id", authMiddleware, handleDeleteDeck);
router.get("/my/decks/:id/cards", authMiddleware, handleGetDeckCards);
router.post("/my/decks/:id/cards", authMiddleware, handleAddCard);
router.patch("/my/decks/:id/cards/:cardId", authMiddleware, handleUpdateCard);
router.delete("/my/decks/:id/cards/:cardId", authMiddleware, handleDeleteCard);

export default router;