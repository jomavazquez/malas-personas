import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import roomsRoutes from "./modules/rooms/rooms.routes.js";
import decksRoutes from "./modules/decks/decks.routes.js";
import contactRoutes from "./modules/contact/contact.routes.js";

const app = express();

// ── Security headers
app.use( helmet() );

// ── CORS
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// ── Body parser
app.use( express.json() );

// ── Rate limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "RATE_LIMIT_EXCEEDED" },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "RATE_LIMIT_EXCEEDED" },
});

app.use( globalLimiter );

// ── Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/decks", decksRoutes);
app.use("/api/contact", contactRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", project: "malas-personas" }));

app.use( errorMiddleware );

export default app;