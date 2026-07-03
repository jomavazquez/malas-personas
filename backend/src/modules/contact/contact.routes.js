import { Router } from "express";
import { handleContact } from "./contact.controller.js";

const router = Router();

router.post("/", handleContact);

export default router;