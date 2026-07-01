import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateMeSchema } from "./users.schema.js";
import { handleGetMe, handleUpdateMe } from "./users.controller.js";

const router = Router();

router.get("/me", authMiddleware, handleGetMe);
router.patch("/me", authMiddleware, validate(updateMeSchema), handleUpdateMe);

export default router;