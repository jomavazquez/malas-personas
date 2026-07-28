import { createServer } from "http";
import app from "./src/app.js";
import { initSocket } from "./src/lib/socket.js";
import { env } from "./src/config/env.js";

const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Una excepción no controlada (p.ej. en un setTimeout de una partida) no debe tirar
// abajo el servidor para todos los usuarios — se registra y el proceso sigue vivo.
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