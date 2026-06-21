// In-memory store of active game sessions
// Map<roomCode, GameSession>
const activeSessions = new Map();

export const getSession = (roomCode) => activeSessions.get(roomCode);
export const setSession = (roomCode, session) => activeSessions.set(roomCode, session);
export const deleteSession = (roomCode) => activeSessions.delete(roomCode);
export const hasSession = (roomCode) => activeSessions.has(roomCode);
