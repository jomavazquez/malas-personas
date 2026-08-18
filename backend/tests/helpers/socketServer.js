import { createServer } from "http";
import { io as ioClient } from "socket.io-client";
import app from "../../src/app.js";
import { initSocket } from "../../src/lib/socket.js";

// Boots the real Express + Socket.io stack (the same wiring as server.js) on an
// ephemeral port, for integration tests that need real sockets talking to the
// real gateways/services/DB. Returns a teardown() to close everything cleanly.
export const startTestServer = () => {
  return new Promise((resolve, reject) => {
    const httpServer = createServer(app);
    const io = initSocket(httpServer);

    httpServer.on("error", reject);

    httpServer.listen(0, () => {
      const { port } = httpServer.address();
      resolve({
        httpServer,
        io,
        port,
        teardown: () => stopTestServer({ httpServer, io }),
      });
    });
  });
};

export const stopTestServer = ({ httpServer, io }) => {
  return new Promise((resolve) => {
    io.disconnectSockets(true);
    io.close(() => {
      httpServer.close(() => resolve());
    });
  });
};

// Connects a socket.io-client to the test server with sensible defaults for tests:
// forces a brand-new connection (no shared manager/state between test clients),
// disables the built-in reconnection logic (tests control disconnects explicitly),
// and waits for the "connect" event before resolving.
export const connectClient = (port, extra = {}) => {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ["websocket"],
      ...extra,
    });

    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  });
};

// Promisifies a socket.io emit-with-ack call (all this app's gateway handlers
// invoke their `callback` argument with either { success: true, ... } or { error }).
export const emitAck = (socket, event, payload) => {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(event, payload, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
};

// Resolves with the first payload emitted for `event`, or rejects if it doesn't
// arrive within `timeoutMs` — for asserting broadcasts that have no ack.
export const waitForEvent = (socket, event, timeoutMs = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for "${event}"`));
    }, timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
};