// In-memory store of active game sessions
// Map<roomCode, GameSession>
const activeSessions = new Map();

export const getSession = (roomCode) => activeSessions.get(roomCode);
export const setSession = (roomCode, session) => activeSessions.set(roomCode, session);
export const deleteSession = (roomCode) => activeSessions.delete(roomCode);
export const hasSession = (roomCode) => activeSessions.has(roomCode);

// Identifica al jugador detrás de cada socket, compartido por todos los juegos
// Map<socketId, { roomCode, userId, username }>
const socketMeta = new Map();

export const getSocketMeta = (socketId) => socketMeta.get(socketId);
export const setSocketMeta = (socketId, meta) => socketMeta.set(socketId, meta);
export const deleteSocketMeta = (socketId) => socketMeta.delete(socketId);