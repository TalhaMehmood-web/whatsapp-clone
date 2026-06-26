import { prisma } from "./prisma.js";

const BLOCKED_USER_SELECT = {
  id: true,
  name: true,
  avatar: true,
  about: true,
  phone: true,
  email: true,
};

export async function blockUser({ userId, targetId }) {
  if (userId === targetId) {
    const err = new Error("Cannot block yourself");
    err.status = 400;
    throw err;
  }
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
    update: {},
    create: { blockerId: userId, blockedId: targetId },
  });
}

export async function unblockUser({ userId, targetId }) {
  await prisma.block
    .delete({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId: targetId },
      },
    })
    .catch(() => {});
}

export async function listBlocked(userId) {
  const rows = await prisma.block.findMany({
    where: { blockerId: userId },
    orderBy: { createdAt: "desc" },
    include: { blocked: { select: BLOCKED_USER_SELECT } },
  });
  return rows.map((r) => r.blocked);
}

// Returns true if `userId` has blocked `peerId` OR vice-versa. This is the
// gate we apply at the message-send + chat-start boundaries.
export async function isBlockedBetween(userId, peerId) {
  if (!userId || !peerId || userId === peerId) return false;
  const row = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: peerId },
        { blockerId: peerId, blockedId: userId },
      ],
    },
    select: { id: true },
  });
  return !!row;
}
