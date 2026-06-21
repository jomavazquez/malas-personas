import { createServer } from "http";
import app from "./src/app.js";
import { initSocket } from "./src/lib/socket.js";
import { env } from "./src/config/env.js";

const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

httpServer.listen( env.PORT, () => {
  console.log(`Malas Personas backend running on port ${ env.PORT }`);
  console.log(`Mode: ${ env.NODE_ENV }`);
});