// Custom Node entry point — wraps Next.js so we can attach Socket.io to the
// same HTTP server. Started by `npm run dev` / `npm start`.
//
// See CLAUDE.md → "Socket.io (custom server)" for the design.

import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { verifyToken } from "./src/lib/auth.js";
import { setIO } from "./src/lib/socket-server.js";
import { SOCKET_EVENT } from "./src/config/constants.js";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handler = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((req, res) => handler(req, res));

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_URL ?? `http://localhost:${port}`,
    credentials: true,
  },
});
setIO(io);

io.use(async (socket, nextFn) => {
  const user = await verifyToken(socket.handshake.auth?.token);
  if (!user) return nextFn(new Error("Unauthorized"));
  socket.data.userId = user.id;
  nextFn();
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);
  io.emit(SOCKET_EVENT.USER_ONLINE, { userId });

  socket.on(SOCKET_EVENT.CHAT_JOIN, (chatId) =>
    socket.join(`chat:${chatId}`),
  );
  socket.on(SOCKET_EVENT.CHAT_LEAVE, (chatId) =>
    socket.leave(`chat:${chatId}`),
  );

  // Message fan-out is driven by the API route handler (which persists first
  // and then emits via lib/socket-server), so we don't need a `message:send`
  // listener here.

  // Read receipts: the client tells us "I read up to messageId in chatId",
  // we let the route handler persist it (POST /api/messages/:id/read in a
  // later phase) — for now just rebroadcast so other tabs of the same user
  // can stay in sync.
  socket.on(SOCKET_EVENT.MESSAGE_READ, (data) =>
    io.to(`chat:${data.chatId}`).emit(SOCKET_EVENT.MESSAGE_READ, data),
  );

  socket.on(SOCKET_EVENT.TYPING_START, (data) =>
    socket
      .to(`chat:${data.chatId}`)
      .emit(SOCKET_EVENT.TYPING_UPDATE, {
        ...data,
        userId,
        typing: true,
      }),
  );

  socket.on(SOCKET_EVENT.TYPING_STOP, (data) =>
    socket
      .to(`chat:${data.chatId}`)
      .emit(SOCKET_EVENT.TYPING_UPDATE, {
        ...data,
        userId,
        typing: false,
      }),
  );

  // WebRTC signaling: pure relay. Clients exchange SDP offers/answers and
  // ICE candidates inside a `call:signal` envelope routed by `toUserId`.
  socket.on(SOCKET_EVENT.CALL_SIGNAL, (data) => {
    if (!data?.toUserId) return;
    io.to(`user:${data.toUserId}`).emit(SOCKET_EVENT.CALL_SIGNAL, {
      ...data,
      fromUserId: userId,
    });
  });

  socket.on("disconnect", () =>
    io.emit(SOCKET_EVENT.USER_OFFLINE, { userId, lastSeen: new Date() }),
  );
});

httpServer.listen(port, () => {
  console.log(`> WhatsApp clone ready on http://localhost:${port}`);
});
