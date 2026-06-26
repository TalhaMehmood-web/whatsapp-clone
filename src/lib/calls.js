import { prisma } from "./prisma.js";
import { emitToUser, emitToChat } from "./socket-server.js";
import { findDirectChat } from "./chats.js";
import {
  CallStatus,
  CallType,
  MessageMetadataKind,
  MessageType,
} from "@/models/enums";
import { SOCKET_EVENT } from "@/config/constants";

// Phase 12: signaling + call-log persistence. WebRTC media itself runs
// peer-to-peer; this layer just tracks who called whom and emits socket
// updates so both clients can move through ringing → answered → ended in
// real time.

export async function listCallLog(userId) {
  const rows = await prisma.callParticipant.findMany({
    where: { userId },
    include: {
      call: {
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      },
    },
    orderBy: { call: { createdAt: "desc" } },
    take: 100,
  });
  return rows.map(({ call }) => ({
    id: call.id,
    type: call.type,
    status: call.status,
    callerId: call.callerId,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    createdAt: call.createdAt,
    participants: call.participants.map((p) => p.user),
  }));
}

// "Join via call link" path. Either retrieves the existing call (so a
// second clicker just lands on the in-progress one) or creates it on
// the spot with the link-clicker as the caller and the chat members as
// participants. Unlike createCall this does NOT ring anyone — the link
// itself was the invitation.
export async function joinCallLink({
  joinerId,
  callId,
  participantIds = [],
  type = CallType.VOICE,
}) {
  const existing = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });
  if (existing) {
    // Make sure the joiner is a participant — otherwise their CallScreen
    // can't render their video / receive signaling.
    const alreadyIn = existing.participants.some(
      (p) => p.userId === joinerId,
    );
    if (!alreadyIn) {
      await prisma.callParticipant.create({
        data: { callId, userId: joinerId },
      });
    }
    return existing;
  }
  const ids = Array.from(new Set([joinerId, ...participantIds]));
  const call = await prisma.call.create({
    data: {
      id: callId,
      type,
      callerId: joinerId,
      status: CallStatus.ONGOING,
      startedAt: new Date(),
      participants: { create: ids.map((userId) => ({ userId })) },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });
  notifyCallLog(call.participants.map((p) => p.userId));
  return call;
}

export async function createCall({
  callerId,
  participantIds,
  type = CallType.VOICE,
}) {
  const ids = Array.from(new Set([callerId, ...(participantIds ?? [])]));
  if (ids.length < 2) {
    const err = new Error("A call needs at least two participants");
    err.status = 400;
    throw err;
  }

  // Born in RINGING. Caller renders the "calling…" screen; callee sees the
  // incoming modal. The transition to ANSWERED happens when callee accepts.
  const call = await prisma.call.create({
    data: {
      type,
      callerId,
      status: CallStatus.RINGING,
      participants: { create: ids.map((userId) => ({ userId })) },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  const caller = call.participants.find((p) => p.userId === callerId)?.user;
  for (const p of call.participants) {
    if (p.userId === callerId) continue;
    emitToUser(p.userId, SOCKET_EVENT.CALL_OFFER, {
      callId: call.id,
      type: call.type,
      caller,
    });
  }
  // Tell every participant (incl. caller) about the freshly-created log
  // entry so call-log panes refresh immediately.
  notifyCallLog(call.participants.map((p) => p.userId));

  return call;
}

// Generic status transition. Computes startedAt / endedAt based on the
// new status and fans CALL_UPDATE to *every* participant — that's how the
// caller's "Calling…" screen learns the callee declined / answered / ended.
export async function updateCall({ callId, userId, status }) {
  const existing = await prisma.call.findUnique({
    where: { id: callId },
    select: { status: true, startedAt: true, callerId: true },
  });
  if (!existing) {
    const err = new Error("Call not found");
    err.status = 404;
    throw err;
  }
  const part = await prisma.callParticipant.findFirst({
    where: { callId, userId },
  });
  if (!part) {
    const err = new Error("Not a participant");
    err.status = 403;
    throw err;
  }

  const data = { status };
  if (status === CallStatus.ANSWERED && !existing.startedAt) {
    data.startedAt = new Date();
  }
  if (
    status === CallStatus.DECLINED ||
    status === CallStatus.MISSED ||
    status === CallStatus.ENDED
  ) {
    data.endedAt = new Date();
  }

  const call = await prisma.call.update({
    where: { id: callId },
    data,
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  for (const p of call.participants) {
    emitToUser(p.userId, SOCKET_EVENT.CALL_UPDATE, {
      callId,
      status,
      by: userId,
      endedAt: data.endedAt ?? null,
      startedAt: call.startedAt ?? null,
    });
  }
  notifyCallLog(call.participants.map((p) => p.userId));

  // If the call just hit a terminal state, drop a SYSTEM message into the
  // 1:1 chat so the conversation history mirrors the call log (matches
  // WhatsApp's "Voice call · 02:14" / "Missed voice call" bubble).
  const isTerminal =
    status === CallStatus.ENDED ||
    status === CallStatus.MISSED ||
    status === CallStatus.DECLINED;
  if (isTerminal) {
    await maybePostCallSystemMessage({ call, status });
  }
  return call;
}

async function maybePostCallSystemMessage({ call, status }) {
  if (call.participants.length !== 2) return;
  const [a, b] = call.participants.map((p) => p.userId);
  const chat = await findDirectChat(a, b);
  if (!chat) return; // No DM exists — call originated from a non-chat surface.
  const durationSec =
    call.startedAt && call.endedAt
      ? Math.max(
          0,
          Math.round(
            (new Date(call.endedAt).getTime() -
              new Date(call.startedAt).getTime()) /
              1000,
          ),
        )
      : 0;

  const created = await prisma.message.create({
    data: {
      chatId: chat.id,
      senderId: call.callerId ?? a,
      type: MessageType.SYSTEM,
      metadata: {
        kind: MessageMetadataKind.CALL,
        callId: call.id,
        callType: call.type,
        callStatus: status,
        durationSec,
        callerId: call.callerId,
      },
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  });
  // Bump the chat's updatedAt so the row jumps to the top of the list.
  await prisma.chat.update({
    where: { id: chat.id },
    data: { updatedAt: new Date() },
  });
  emitToChat(chat.id, SOCKET_EVENT.MESSAGE_NEW, created);
  // Same per-user fanout as the normal send path so the row bumps in
  // both participants' chat lists even when they don't have the chat open.
  for (const p of call.participants) {
    if (p.userId === created.senderId) continue;
    emitToUser(p.userId, SOCKET_EVENT.MESSAGE_NEW, created);
  }
}

// Distinguishes caller-cancel-while-ringing from a clean hangup. If we
// were still in RINGING/ANSWERED with no startedAt, this counts as MISSED
// for the callee; otherwise it's a clean ENDED.
export async function endCall({ callId, userId }) {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: { status: true, startedAt: true },
  });
  if (!call) {
    const err = new Error("Call not found");
    err.status = 404;
    throw err;
  }
  const wasRinging =
    call.status === CallStatus.RINGING && !call.startedAt;
  return updateCall({
    callId,
    userId,
    status: wasRinging ? CallStatus.MISSED : CallStatus.ENDED,
  });
}

// Push every participant's call log to re-fetch. Cheaper than diffing the
// list server-side — the client just calls invalidateQueries.
function notifyCallLog(userIds) {
  for (const uid of new Set(userIds)) {
    emitToUser(uid, SOCKET_EVENT.CALL_LOG_UPDATE, {});
  }
}
