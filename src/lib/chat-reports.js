import { prisma } from "./prisma.js";

// Idempotent abuse report on a group chat. Same shape as reportChannel
// + reportCommunity — kept parallel deliberately.
//
// We don't moderate today; the row exists for a future review dashboard.
// Membership isn't strictly required (a user might report a group they
// were just removed from), but we still gate on "chat exists" and
// "chat is a group" — reporting a 1:1 is a UX confusion and the block
// flow is the right tool there.
export async function reportChat({ userId, chatId, reason }) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, isGroup: true },
  });
  if (!chat) {
    const err = new Error("Chat not found");
    err.status = 404;
    throw err;
  }
  if (!chat.isGroup) {
    const err = new Error(
      "1:1 conversations can't be reported. Block the contact instead.",
    );
    err.status = 400;
    throw err;
  }
  const clean = typeof reason === "string" ? reason.slice(0, 280) : null;
  await prisma.chatReport.upsert({
    where: { chatId_userId: { chatId, userId } },
    update: { reason: clean },
    create: { chatId, userId, reason: clean },
  });
}
