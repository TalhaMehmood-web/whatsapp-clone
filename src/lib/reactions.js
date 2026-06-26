import { prisma } from "./prisma.js";
import { emitToChat } from "./socket-server.js";
import { SOCKET_EVENT } from "@/config/constants";

// Toggle reaction. Rules (match WhatsApp Web):
//   - One reaction per (message, user). Sending a second different emoji
//     replaces the first.
//   - Tapping the same emoji again removes it.
export async function toggleReaction({ userId, messageId, emoji }) {
  await assertCanReact(userId, messageId);

  const existing = await prisma.reaction.findUnique({
    where: { messageId_userId: { messageId, userId } },
  });

  let result;
  if (existing?.emoji === emoji) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    result = { removed: true, emoji };
  } else if (existing) {
    result = await prisma.reaction.update({
      where: { id: existing.id },
      data: { emoji },
    });
  } else {
    result = await prisma.reaction.create({
      data: { messageId, userId, emoji },
    });
  }

  // Re-broadcast the full reaction list for this message so peers can do a
  // simple cache replace rather than reconciling deltas.
  const full = await prisma.message.findUnique({
    where: { id: messageId },
    select: { chatId: true, reactions: true },
  });
  if (full?.chatId) {
    emitToChat(full.chatId, SOCKET_EVENT.MESSAGE_REACTION, {
      messageId,
      reactions: full.reactions,
    });
  }
  return result;
}

async function assertCanReact(userId, messageId) {
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: { chatId: true },
  });
  if (!msg) {
    const err = new Error("Message not found");
    err.status = 404;
    throw err;
  }
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId: msg.chatId, userId } },
    select: { id: true },
  });
  if (!member) {
    const err = new Error("Not a member of this chat");
    err.status = 403;
    throw err;
  }
}
