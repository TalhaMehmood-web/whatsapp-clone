import { prisma } from "./prisma.js";
import { emitToChat, emitToUser } from "./socket-server.js";
import { SOCKET_EVENT } from "@/config/constants";
import { ReceiptStatus } from "@/models/enums";

// Fan a receipt event to every chat member except the actor. Used by
// both markChatRead + markChatDelivered.
//
// Why dual-fan (chat room + per-user room): emitToChat only reaches
// clients currently subscribed to chat-{id}, which means only people
// viewing this chat. The sender of a message often isn't viewing this
// chat (they're on a different chat, /status, /channels, etc.), so a
// chat-room-only emit silently dropped the receipt and the sender's
// tick stayed grey forever. MESSAGE_NEW already dual-fans for the
// same reason — receipts need the same treatment.
async function fanoutReceiptToOtherMembers(chatId, actorId, event, payload) {
  emitToChat(chatId, event, payload);
  const members = await prisma.chatMember.findMany({
    where: { chatId },
    select: { userId: true },
  });
  for (const { userId } of members) {
    if (userId === actorId) continue;
    emitToUser(userId, event, payload);
  }
}

// Mark every undelivered/unread message in this chat as READ for the given
// user, set their unread count to 0, and broadcast the receipt update so
// other tabs / peers can move the ticks to blue.
export async function markChatRead({ chatId, userId }) {
  const now = new Date();
  await prisma.$transaction([
    prisma.messageReceipt.updateMany({
      where: {
        userId,
        message: { chatId },
        status: { in: [ReceiptStatus.SENT, ReceiptStatus.DELIVERED] },
      },
      data: { status: ReceiptStatus.READ, deliveredAt: now, seenAt: now },
    }),
    prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId } },
      data: { unreadCount: 0, lastReadAt: now },
    }),
  ]);

  await fanoutReceiptToOtherMembers(chatId, userId, SOCKET_EVENT.MESSAGE_READ, {
    chatId,
    userId,
    readAt: now.toISOString(),
  });
}

// Flip every still-SENT receipt in this chat to DELIVERED for the given
// user — driven by the client when it sees MESSAGE_NEW arrive (i.e. the
// app is reachable and the realtime layer is live). Only when the user
// hasn't opened the chat yet; markChatRead supersedes this whenever the
// chat is actually focused.
//
// We emit MESSAGE_DELIVERED so the sender's bubble can flip to the
// double-grey tick in real time. No-op if no rows transitioned (the
// chat might already be in DELIVERED or READ).
export async function markChatDelivered({ chatId, userId }) {
  const now = new Date();
  const result = await prisma.messageReceipt.updateMany({
    where: {
      userId,
      message: { chatId },
      status: ReceiptStatus.SENT,
    },
    data: { status: ReceiptStatus.DELIVERED, deliveredAt: now },
  });
  if (result.count === 0) return { count: 0 };

  await fanoutReceiptToOtherMembers(
    chatId,
    userId,
    SOCKET_EVENT.MESSAGE_DELIVERED,
    {
      chatId,
      userId,
      deliveredAt: now.toISOString(),
    },
  );
  return { count: result.count };
}
