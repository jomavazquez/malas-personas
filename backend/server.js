import { createServer } from "http";
import app from "./src/app.js";
import { initSocket } from "./src/lib/socket.js";
import { env } from "./src/config/env.js";

const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// An uncaught exception (e.g. in a game's setTimeout) must not take the server down
// for every user: it gets logged and the process keeps running.
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

httpServer.listen( env.PORT, () => {
  console.log(`Malas Personas backend running on port ${ env.PORT }`);
  console.log(`Mode: ${ env.NODE_ENV }`);
});