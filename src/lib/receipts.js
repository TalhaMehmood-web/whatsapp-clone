import { prisma } from "./prisma.js";
import { emitToChat } from "./socket-server.js";
import { SOCKET_EVENT } from "@/config/constants";
import { ReceiptStatus } from "@/models/enums";

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

  emitToChat(chatId, SOCKET_EVENT.MESSAGE_READ, {
    chatId,
    userId,
    readAt: now.toISOString(),
  });
}
