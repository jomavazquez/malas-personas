import { Router } from "express";
import { handleGetRandomPrompt } from "./v_o_m.controller.js";

const router = Router();

router.get("/random", handleGetRandomPrompt);

export default router;