import { Router } from "express";
import { handleGetDecks, handleGetDeckById } from "./decks.controller.js";

const router = Router();

router.get("/", handleGetDecks);
router.get("/:id", handleGetDeckById);

export default router;
