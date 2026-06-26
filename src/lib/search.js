import { prisma } from "./prisma.js";

// Searches across messages I can see + contacts I share a chat with.
// Returns { messages, contacts } sorted by recency.
export async function globalSearch({ userId, query }) {
  const q = query?.trim();
  if (!q) return { messages: [], contacts: [] };

  const myMemberships = await prisma.chatMember.findMany({
    where: { userId },
    select: { chatId: true },
  });
  const chatIds = myMemberships.map((m) => m.chatId);

  if (chatIds.length === 0) {
    return { messages: [], contacts: [] };
  }

  const [messages, peers] = await Promise.all([
    prisma.message.findMany({
      where: {
        chatId: { in: chatIds },
        deletedAt: null,
        content: { contains: q, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        chat: {
          select: { id: true, name: true, photo: true, isGroup: true },
        },
      },
    }),
    prisma.chatMember.findMany({
      where: {
        chatId: { in: chatIds },
        userId: { not: userId },
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      distinct: ["userId"],
      take: 25,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            about: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    }),
  ]);

  return {
    messages,
    contacts: peers.map((p) => p.user),
  };
}

// Per-chat message search. Returns matches oldest→newest so the UI can
// step forward / backward through them.
export async function chatSearch({ userId, chatId, query }) {
  const q = query?.trim();
  if (!q) return [];
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: { id: true },
  });
  if (!member) return [];

  return prisma.message.findMany({
    where: {
      chatId,
      deletedAt: null,
      content: { contains: q, mode: "insensitive" },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, createdAt: true, content: true, senderId: true },
  });
}
