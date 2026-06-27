import { prisma } from "./prisma.js";
import { emitToUser } from "./socket-server.js";
import { createNotification } from "./notifications.js";
import { COPY, ROUTES, SOCKET_EVENT } from "@/config/constants";
import { MemberRole, NotificationKind } from "@/models/enums";

// Create a group chat. The caller becomes OWNER; everyone else is MEMBER.
export async function createGroup({ ownerId, name, photo, description, memberIds }) {
  if (!name?.trim()) {
    const err = new Error("Group name is required");
    err.status = 400;
    throw err;
  }

  const peers = (memberIds ?? []).filter((id) => id && id !== ownerId);
  const unique = Array.from(new Set([ownerId, ...peers]));
  if (unique.length < 2) {
    const err = new Error("A group needs at least one other member");
    err.status = 400;
    throw err;
  }

  const chat = await prisma.chat.create({
    data: {
      isGroup: true,
      name: name.trim(),
      photo: photo ?? null,
      description: description ?? null,
      members: {
        create: unique.map((userId) => ({
          userId,
          role: userId === ownerId ? MemberRole.OWNER : MemberRole.MEMBER,
        })),
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  await notifyGroupAdded({
    chat,
    actorId: ownerId,
    newMemberIds: Array.from(new Set(peers)),
  });

  return chat;
}

export async function listMembers({ chatId, userId }) {
  await assertGroupMembership(chatId, userId);
  return prisma.chatMember.findMany({
    where: { chatId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          handle: true,
          phone: true,
          about: true,
          avatar: true,
          isOnline: true,
          lastSeen: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });
}

export async function addMembers({ chatId, actorId, userIds }) {
  await assertCanManage(chatId, actorId);
  const ids = Array.from(new Set((userIds ?? []).filter(Boolean)));
  if (ids.length === 0) return [];

  // Compute who's actually new — anyone already a member shouldn't get a
  // duplicate notification.
  const existing = await prisma.chatMember.findMany({
    where: { chatId, userId: { in: ids } },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((m) => m.userId));
  const newMemberIds = ids.filter((id) => !existingIds.has(id));

  await prisma.chatMember.createMany({
    data: ids.map((userId) => ({ chatId, userId, role: MemberRole.MEMBER })),
    skipDuplicates: true,
  });

  if (newMemberIds.length > 0) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, name: true, photo: true },
    });
    await notifyGroupAdded({ chat, actorId, newMemberIds });
  }

  return listMembers({ chatId, userId: actorId });
}

export async function removeMember({ chatId, actorId, targetUserId }) {
  await assertCanManage(chatId, actorId);
  if (targetUserId === actorId) {
    const err = new Error("Use leave group instead of removing yourself");
    err.status = 400;
    throw err;
  }

  // Capture group meta before the delete so the notification has a name.
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, name: true, photo: true, isGroup: true },
  });

  await prisma.chatMember.delete({
    where: { chatId_userId: { chatId, userId: targetUserId } },
  });

  if (chat?.isGroup) {
    await notifyGroupRemoved({ chat, actorId, removedUserId: targetUserId });
    await emitGroupUpdate({ chatId, exceptUserId: targetUserId });
  }
}

export async function updateMemberRole({ chatId, actorId, targetUserId, role }) {
  await assertCanManage(chatId, actorId);
  if (!Object.values(MemberRole).includes(role)) {
    const err = new Error("Invalid role");
    err.status = 400;
    throw err;
  }
  return prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId: targetUserId } },
    data: { role },
  });
}

export async function leaveGroup({ chatId, userId }) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, isGroup: true },
  });
  await prisma.chatMember.delete({
    where: { chatId_userId: { chatId, userId } },
  });
  if (chat?.isGroup) {
    await emitGroupUpdate({ chatId, exceptUserId: userId });
  }
}

export async function updateGroupMeta({
  chatId,
  actorId,
  name,
  photo,
  description,
  isAnnouncement,
}) {
  await assertCanManage(chatId, actorId);
  return prisma.chat.update({
    where: { id: chatId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(photo !== undefined ? { photo } : {}),
      ...(description !== undefined ? { description } : {}),
      // Admin-only flag (GR1). When ON, only OWNER/ADMIN chat members
      // can send messages — the server check is in createMessage().
      // Community announcement chats set this at creation time; here
      // it's also flippable for any standalone group.
      ...(isAnnouncement !== undefined
        ? { isAnnouncement: Boolean(isAnnouncement) }
        : {}),
    },
  });
}

// Persist a `GROUP_ADDED` Notification per invitee + emit a `group:added`
// socket event so the receiver's chat list refreshes without a poll.
async function notifyGroupAdded({ chat, actorId, newMemberIds }) {
  if (!chat || newMemberIds.length === 0) return;
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, name: true, handle: true, avatar: true },
  });

  await Promise.all(
    newMemberIds.map(async (userId) => {
      await createNotification({
        userId,
        kind: NotificationKind.GROUP_ADDED,
        title: COPY.NOTIFICATION_GROUP_ADDED_TITLE,
        body: COPY.NOTIFICATION_GROUP_ADDED_BODY({
          groupName: chat.name ?? "a group",
          by: actor?.handle,
        }),
        data: {
          chatId: chat.id,
          chatName: chat.name,
          chatPhoto: chat.photo,
          addedById: actor?.id,
          addedByName: actor?.name,
          addedByHandle: actor?.handle,
          addedByAvatar: actor?.avatar,
          url: ROUTES.CHAT_DETAIL(chat.id),
        },
      });
      emitToUser(userId, SOCKET_EVENT.GROUP_ADDED, {
        chatId: chat.id,
        chatName: chat.name,
        addedById: actor?.id,
      });
    }),
  );
}

// Mirror of notifyGroupAdded for the removal case. Persists a single
// notification on the removed user's row + fires `group:removed` so their
// chat list cache can drop the row without a refetch.
async function notifyGroupRemoved({ chat, actorId, removedUserId }) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, name: true, handle: true, avatar: true },
  });

  await createNotification({
    userId: removedUserId,
    kind: NotificationKind.GROUP_REMOVED,
    title: COPY.NOTIFICATION_GROUP_REMOVED_TITLE,
    body: COPY.NOTIFICATION_GROUP_REMOVED_BODY({
      groupName: chat.name ?? "a group",
      by: actor?.handle,
    }),
    data: {
      chatId: chat.id,
      chatName: chat.name,
      chatPhoto: chat.photo,
      removedById: actor?.id,
      removedByHandle: actor?.handle,
      removedByName: actor?.name,
    },
  });

  emitToUser(removedUserId, SOCKET_EVENT.GROUP_REMOVED, {
    chatId: chat.id,
    chatName: chat.name,
    removedById: actor?.id,
  });
}

// Tells the remaining members "the membership of this group changed".
// They use it to refetch chats.detail + members so the headcount stays
// correct without each viewer polling.
async function emitGroupUpdate({ chatId, exceptUserId }) {
  const remaining = await prisma.chatMember.findMany({
    where: { chatId },
    select: { userId: true },
  });
  for (const { userId } of remaining) {
    if (userId === exceptUserId) continue;
    emitToUser(userId, SOCKET_EVENT.GROUP_UPDATE, { chatId });
  }
}

async function assertGroupMembership(chatId, userId) {
  const m = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    include: { chat: { select: { isGroup: true } } },
  });
  if (!m || !m.chat.isGroup) {
    const err = new Error("Not a member of this group");
    err.status = 403;
    throw err;
  }
}

async function assertCanManage(chatId, userId) {
  const m = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    include: { chat: { select: { isGroup: true } } },
  });
  if (!m || !m.chat.isGroup) {
    const err = new Error("Not a member of this group");
    err.status = 403;
    throw err;
  }
  if (m.role === MemberRole.MEMBER) {
    const err = new Error("Only admins can manage group members");
    err.status = 403;
    throw err;
  }
}
