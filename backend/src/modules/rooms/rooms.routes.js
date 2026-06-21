import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createRoomSchema } from "./rooms.schema.js";
import { handleCreateRoom, handleGetRoom, handleCloseRoom } from "./rooms.controller.js";

const router = Router();

router.post("/", authMiddleware, validate(createRoomSchema), handleCreateRoom);
router.get("/:code", handleGetRoom);
router.patch("/:code/close", authMiddleware, handleCloseRoom);

export default router;
