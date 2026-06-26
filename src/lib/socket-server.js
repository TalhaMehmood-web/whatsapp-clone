// Lets server-side code (route handlers, lib helpers) reach the Socket.IO
// instance that `server.js` attaches. `server.js` registers the instance on
// `globalThis.__io` at boot; everything else reads it from here.

export function getIO() {
  return globalThis.__io ?? null;
}

export function setIO(io) {
  globalThis.__io = io;
}

// Emit to every member of a chat (including the sender — easier than tracking
// per-socket identity for self-fanout).
export function emitToChat(chatId, event, payload) {
  const io = getIO();
  if (!io) return;
  io.to(`chat:${chatId}`).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  const io = getIO();
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}
