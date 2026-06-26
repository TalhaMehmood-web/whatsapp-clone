import { prisma } from "./prisma.js";
import { emitToUser } from "./socket-server.js";
import { isBlockedBetween } from "./block.js";
import { createNotification } from "./notifications.js";
import { COPY, SOCKET_EVENT } from "@/config/constants";
import { NotificationKind } from "@/models/enums";

// Phase C: friend-request handshake. Gates 1:1 chat creation + messaging
// behind an explicit accepted request, matching the Instagram-style flow
// the user asked for.
//
// Status transitions:
//   PENDING   → ACCEPTED | DECLINED | CANCELED
//   ACCEPTED  is terminal (delete + re-send to "unfriend").
//   DECLINED, CANCELED stay until a new PENDING is sent.

const PUBLIC_USER = {
  id: true,
  handle: true,
  name: true,
  avatar: true,
  about: true,
  isOnline: true,
  lastSeen: true,
};

const REQ_INCLUDE = {
  from: { select: PUBLIC_USER },
  to: { select: PUBLIC_USER },
};

export async function sendFriendRequest({ fromId, toId }) {
  if (fromId === toId) {
    const err = new Error("You can't friend yourself");
    err.status = 400;
    throw err;
  }
  if (await isBlockedBetween(fromId, toId)) {
    const err = new Error("Not allowed");
    err.status = 403;
    throw err;
  }

  // Already friends in either direction? Idempotent — return the row.
  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { fromId, toId },
        { fromId: toId, toId: fromId },
      ],
    },
    include: REQ_INCLUDE,
  });
  if (existing?.status === "ACCEPTED") return existing;

  // Replace any prior pending/declined/canceled row from this sender so the
  // unique key isn't violated. If the *other* side sent us a PENDING, treat
  // the call as "accept it".
  if (existing) {
    if (existing.toId === fromId && existing.status === "PENDING") {
      return acceptFriendRequest({
        actorId: fromId,
        requestId: existing.id,
      });
    }
    if (existing.fromId === fromId) {
      const updated = await prisma.friendRequest.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          createdAt: new Date(),
          respondedAt: null,
        },
        include: REQ_INCLUDE,
      });
      emitToUser(toId, SOCKET_EVENT.FRIEND_REQUEST, updated);
      await notifyIncomingRequest(updated);
      return updated;
    }
  }

  const created = await prisma.friendRequest.create({
    data: { fromId, toId, status: "PENDING" },
    include: REQ_INCLUDE,
  });
  emitToUser(toId, SOCKET_EVENT.FRIEND_REQUEST, created);
  await notifyIncomingRequest(created);
  return created;
}

export async function acceptFriendRequest({ actorId, requestId }) {
  const req = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });
  if (!req || req.toId !== actorId || req.status !== "PENDING") {
    const err = new Error("Request not found");
    err.status = 404;
    throw err;
  }
  const updated = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED", respondedAt: new Date() },
    include: REQ_INCLUDE,
  });
  emitToUser(req.fromId, SOCKET_EVENT.FRIEND_REQUEST_UPDATE, updated);
  emitToUser(req.toId, SOCKET_EVENT.FRIEND_REQUEST_UPDATE, updated);
  await notifyAcceptance(updated);
  return updated;
}

export async function declineFriendRequest({ actorId, requestId }) {
  const req = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });
  if (!req || req.toId !== actorId || req.status !== "PENDING") {
    const err = new Error("Request not found");
    err.status = 404;
    throw err;
  }
  const updated = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "DECLINED", respondedAt: new Date() },
    include: REQ_INCLUDE,
  });
  emitToUser(req.fromId, SOCKET_EVENT.FRIEND_REQUEST_UPDATE, updated);
  return updated;
}

export async function cancelFriendRequest({ actorId, requestId }) {
  const req = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });
  if (!req || req.fromId !== actorId || req.status !== "PENDING") {
    const err = new Error("Request not found");
    err.status = 404;
    throw err;
  }
  const updated = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "CANCELED", respondedAt: new Date() },
    include: REQ_INCLUDE,
  });
  emitToUser(req.toId, SOCKET_EVENT.FRIEND_REQUEST_CANCEL, updated);
  return updated;
}

export async function unfriend({ userId, peerId }) {
  const row = await prisma.friendRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { fromId: userId, toId: peerId },
        { fromId: peerId, toId: userId },
      ],
    },
  });
  if (!row) return;
  await prisma.friendRequest.delete({ where: { id: row.id } });
  emitToUser(peerId, SOCKET_EVENT.FRIEND_REQUEST_CANCEL, row);
}

export function listIncomingRequests(userId) {
  return prisma.friendRequest.findMany({
    where: { toId: userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: REQ_INCLUDE,
  });
}

export function listOutgoingRequests(userId) {
  return prisma.friendRequest.findMany({
    where: { fromId: userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: REQ_INCLUDE,
  });
}

export async function listFriends(userId) {
  const rows = await prisma.friendRequest.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ fromId: userId }, { toId: userId }],
    },
    include: REQ_INCLUDE,
  });
  return rows.map((r) => (r.fromId === userId ? r.to : r.from));
}

export async function areFriends(userId, peerId) {
  if (!userId || !peerId || userId === peerId) return false;
  const row = await prisma.friendRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { fromId: userId, toId: peerId },
        { fromId: peerId, toId: userId },
      ],
    },
    select: { id: true },
  });
  return !!row;
}

// Returns the friend-request status of a single peer for the current user.
// Used by search results to render a contextual button.
//   - "FRIENDS"   — accepted both ways
//   - "OUTGOING"  — I sent them a pending request
//   - "INCOMING"  — they sent me a pending request
//   - "NONE"      — no relationship yet (or declined/canceled).
export async function relationshipWith(userId, peerId) {
  if (userId === peerId) return "SELF";
  const row = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { fromId: userId, toId: peerId },
        { fromId: peerId, toId: userId },
      ],
    },
    select: { id: true, fromId: true, status: true },
  });
  if (!row) return "NONE";
  if (row.status === "ACCEPTED") return "FRIENDS";
  if (row.status !== "PENDING") return "NONE";
  return row.fromId === userId ? "OUTGOING" : "INCOMING";
}

// Notification side-effects. Persist a Notification row for the receiver
// so the bell badge surfaces it even after the toast disappears.
async function notifyIncomingRequest(req) {
  const handle = req.from?.handle ?? "someone";
  await createNotification({
    userId: req.toId,
    kind: NotificationKind.FRIEND_REQUEST,
    title: COPY.NOTIFICATION_FR_TITLE,
    body: COPY.NOTIFICATION_FR_BODY(handle),
    data: {
      friendRequestId: req.id,
      peerId: req.fromId,
      peerHandle: req.from?.handle,
      peerName: req.from?.name,
      peerAvatar: req.from?.avatar,
    },
  });
}

async function notifyAcceptance(req) {
  const handle = req.to?.handle ?? "someone";
  await createNotification({
    userId: req.fromId,
    kind: NotificationKind.FRIEND_REQUEST_ACCEPTED,
    title: COPY.NOTIFICATION_FR_ACCEPTED_TITLE,
    body: COPY.NOTIFICATION_FR_ACCEPTED_BODY(handle),
    data: {
      friendRequestId: req.id,
      peerId: req.toId,
      peerHandle: req.to?.handle,
      peerName: req.to?.name,
      peerAvatar: req.to?.avatar,
    },
  });
}
