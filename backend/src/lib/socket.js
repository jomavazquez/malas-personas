import { Server } from "socket.io";
import { env } from "../config/env.js";
import { registerGameHandlers } from "../modules/games/malas_personas.gateway.js";
import { registerVerdadOMentiraHandlers } from "../modules/games/v_o_m.gateway.js";

let io;

export const initSocket = ( httpServer ) => {

  io = new Server( httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    registerGameHandlers(io, socket);
    registerVerdadOMentiraHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export const getIO = () => {
  if( !io ) throw new Error("Socket.io not initialized");
  return io;
}