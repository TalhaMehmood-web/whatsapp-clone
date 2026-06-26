import { prisma } from "./prisma.js";

export function listLabels(userId) {
  return prisma.label.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createLabel({ userId, name, color }) {
  if (!name?.trim()) {
    const err = new Error("Label name is required");
    err.status = 400;
    throw err;
  }
  try {
    return await prisma.label.create({
      data: { userId, name: name.trim(), color: color ?? "#25D366" },
    });
  } catch (err) {
    if (err.code === "P2002") {
      const e = new Error("Label already exists");
      e.status = 409;
      throw e;
    }
    throw err;
  }
}

export async function deleteLabel({ userId, labelId }) {
  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label || label.userId !== userId) {
    const err = new Error("Label not found");
    err.status = 404;
    throw err;
  }
  await prisma.label.delete({ where: { id: labelId } });
}

export async function assignLabel({ userId, chatId, labelId }) {
  const [member, label] = await Promise.all([
    prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    }),
    prisma.label.findUnique({ where: { id: labelId } }),
  ]);
  if (!member) {
    const err = new Error("Not a member of this chat");
    err.status = 403;
    throw err;
  }
  if (!label || label.userId !== userId) {
    const err = new Error("Label not found");
    err.status = 404;
    throw err;
  }
  await prisma.chatMemberLabel.upsert({
    where: {
      chatMemberId_labelId: { chatMemberId: member.id, labelId },
    },
    update: {},
    create: { chatMemberId: member.id, labelId },
  });
}

export async function unassignLabel({ userId, chatId, labelId }) {
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });
  if (!member) return;
  await prisma.chatMemberLabel
    .delete({
      where: { chatMemberId_labelId: { chatMemberId: member.id, labelId } },
    })
    .catch(() => {});
}
