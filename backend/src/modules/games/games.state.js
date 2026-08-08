// In-memory store of active game sessions
// Map<roomCode, GameSession>
const activeSessions = new Map();

export const getSession = (roomCode) => activeSessions.get(roomCode);
export const setSession = (roomCode, session) => activeSessions.set(roomCode, session);
export const deleteSession = (roomCode) => activeSessions.delete(roomCode);
export const hasSession = (roomCode) => activeSessions.has(roomCode);

// Identifies the player behind each socket, shared across all games
// Map<socketId, { roomCode, userId, username }>
const socketMeta = new Map();

export const getSocketMeta = (socketId) => socketMeta.get(socketId);
export const setSocketMeta = (socketId, meta) => socketMeta.set(socketId, meta);
export const deleteSocketMeta = (socketId) => socketMeta.delete(socketId);

// Grace timers: when a socket drops (network cut), we give a margin before
// removing the player from the room, in case they reconnect in time. Map<`${roomCode}:${userId}`, Timeout>
const disconnectTimers = new Map();

export const setDisconnectTimer = (key, timeoutId) => disconnectTimers.set(key, timeoutId);
export const clearDisconnectTimer = (key) => {
  const timeoutId = disconnectTimers.get(key);
  if( timeoutId ) clearTimeout(timeoutId);
  disconnectTimers.delete(key);
};