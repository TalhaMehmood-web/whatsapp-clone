import { prisma } from "./prisma.js";
import { isBlockedBetween } from "./block.js";
import { areFriends } from "./friend-requests.js";
import { CHAT_TAB } from "@/config/constants";

const CHAT_INCLUDE = {
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          isOnline: true,
          lastSeen: true,
        },
      },
      labels: { include: { label: true } },
    },
  },
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
  },
};

// Returns the chat list for a user, filtered + searched server-side.
// Sorting rules (matches WhatsApp Web):
//   1. Pinned chats first
//   2. Then by last-message time desc (falls back to chat updatedAt)
export async function getChats({ userId, tab = CHAT_TAB.ALL, search }) {
  const where = membershipFilter(userId, tab);
  if (tab === CHAT_TAB.GROUPS) where.isGroup = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      {
        members: {
          some: {
            user: { name: { contains: search, mode: "insensitive" } },
          },
        },
      },
    ];
  }

  const chats = await prisma.chat.findMany({
    where,
    include: CHAT_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });

  return chats
    .map((chat) => toEntry(chat, userId))
    .sort((a, b) => {
      // Pinned chats above unpinned.
      if (a.membership.isPinned !== b.membership.isPinned) {
        return a.membership.isPinned ? -1 : 1;
      }
      const at = a.lastMessage?.createdAt ?? a.chat.updatedAt;
      const bt = b.lastMessage?.createdAt ?? b.chat.updatedAt;
      return new Date(bt) - new Date(at);
    });
}

function membershipFilter(userId, tab) {
  // Archived and Locked are opt-in views. Every other tab excludes both
  // — locked chats only appear inside the dedicated locked-chats screen.
  const base = { members: { some: { userId, ...tabFilter(tab) } } };
  if (tab === CHAT_TAB.ARCHIVED || tab === CHAT_TAB.LOCKED) return base;
  base.members = {
    some: { userId, isArchived: false, isLocked: false, ...tabFilter(tab) },
  };
  return base;
}

function tabFilter(tab) {
  switch (tab) {
    case CHAT_TAB.UNREAD:
      return { unreadCount: { gt: 0 } };
    case CHAT_TAB.FAVOURITES:
      return { isFavourite: true };
    case CHAT_TAB.GROUPS:
      // `isGroup` lives on Chat, but Prisma's `some` filter only matches member
      // rows — we layer the chat-level filter in the outer where below.
      return {};
    case CHAT_TAB.ARCHIVED:
      return { isArchived: true };
    case CHAT_TAB.LOCKED:
      return { isLocked: true };
    default:
      return {};
  }
}

function toEntry(chat, userId) {
  const membership = chat.members.find((m) => m.userId === userId);
  const peers = chat.members
    .filter((m) => m.userId !== userId)
    .map((m) => m.user);
  const labelIds = (membership?.labels ?? []).map((l) => l.labelId);
  return {
    chat: {
      id: chat.id,
      isGroup: chat.isGroup,
      name: chat.name,
      photo: chat.photo,
      description: chat.description,
      communityId: chat.communityId,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    },
    membership: membership && {
      id: membership.id,
      chatId: membership.chatId,
      userId: membership.userId,
      role: membership.role,
      joinedAt: membership.joinedAt,
      isPinned: membership.isPinned,
      isFavourite: membership.isFavourite,
      isArchived: membership.isArchived,
      isLocked: membership.isLocked,
      mutedUntil: membership.mutedUntil,
      unreadCount: membership.unreadCount,
      lastReadAt: membership.lastReadAt,
    },
    lastMessage: chat.messages[0] ?? null,
    peers,
    labelIds,
  };
}

// Lightweight count for the "Archived (N)" pill at the top of the chat list.
// Cheaper than fetching every archived chat just to read .length.
export async function countArchivedChats(userId) {
  return prisma.chatMember.count({
    where: { userId, isArchived: true },
  });
}

// ─── Membership flag toggles ────────────────────────────────────────────────
// Each helper expects (userId, chatId) and returns the updated membership row.

export async function setPinned(userId, chatId, isPinned) {
  return updateMembership(userId, chatId, { isPinned });
}

export async function setFavourite(userId, chatId, isFavourite) {
  return updateMembership(userId, chatId, { isFavourite });
}

export async function setArchived(userId, chatId, isArchived) {
  return updateMembership(userId, chatId, { isArchived });
}

export async function setMuted(userId, chatId, mutedUntil) {
  return updateMembership(userId, chatId, { mutedUntil });
}

export async function setLocked(userId, chatId, isLocked) {
  return updateMembership(userId, chatId, { isLocked });
}

// Set the per-chat disappearing-message TTL (seconds, null = off). Any
// chat member can change it — matches WhatsApp's behaviour. Outgoing
// messages get stamped with expiresAt by createMessage.
export async function setDisappearing({ userId, chatId, seconds }) {
  await assertMembershipForActions(chatId, userId);
  await prisma.chat.update({
    where: { id: chatId },
    data: { disappearingSeconds: seconds ?? null },
  });
}

async function updateMembership(userId, chatId, data) {
  return prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId } },
    data,
  });
}

// Marks the chat as unread for the current user — re-shows the green badge
// in the chat list. Per-user only, so we don't fan this out over sockets.
export async function markChatUnread(userId, chatId) {
  await assertMembershipForActions(chatId, userId);
  return prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId } },
    data: { unreadCount: { increment: 1 }, lastReadAt: null },
  });
}

// "Clear chat" — hides every existing message from THIS user only.
// Peers keep the history. We just stamp a `clearedAt` on my membership;
// `getMessages` filters anything with createdAt <= clearedAt for me.
export async function clearChat(userId, chatId) {
  await assertMembershipForActions(chatId, userId);
  await prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId } },
    data: { clearedAt: new Date() },
  });
}

// "Delete chat" — drops my membership row. If the chat had nobody else
// left we also delete the chat itself so it doesn't dangle.
export async function deleteChatForUser(userId, chatId) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, members: { select: { userId: true } } },
  });
  if (!chat) {
    const err = new Error("Chat not found");
    err.status = 404;
    throw err;
  }

  await prisma.chatMember.delete({
    where: { chatId_userId: { chatId, userId } },
  });

  const remaining = chat.members.filter((m) => m.userId !== userId);
  if (remaining.length === 0) {
    await prisma.chat.delete({ where: { id: chatId } });
  }
}

async function assertMembershipForActions(chatId, userId) {
  const m = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: { id: true },
  });
  if (!m) {
    const err = new Error("Not a member of this chat");
    err.status = 403;
    throw err;
  }
}

// Lookup-only counterpart to startDirectChat. Used by side-channels
// (eg. the call lifecycle posting a system message into the existing 1:1
// chat) where we don't want to bypass the friend-request gate or auto-
// create a chat that didn't exist.
export async function findDirectChat(userIdA, userIdB) {
  if (userIdA === userIdB) return null;
  return prisma.chat.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId: userIdA } } },
        { members: { some: { userId: userIdB } } },
      ],
      members: { every: { userId: { in: [userIdA, userIdB] } } },
    },
  });
}

// Returns the existing 1:1 chat between two users, or creates one and seeds
// the two ChatMember rows. Throws if the peer doesn't exist.
export async function startDirectChat({ userId, peerUserId }) {
  if (userId === peerUserId) {
    const err = new Error("Cannot start a chat with yourself");
    err.status = 400;
    throw err;
  }

  const peer = await prisma.user.findUnique({
    where: { id: peerUserId },
    select: { id: true },
  });
  if (!peer) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // Refuse to even open a 1:1 chat when either side has blocked the other.
  if (await isBlockedBetween(userId, peerUserId)) {
    const err = new Error("You can't message this contact");
    err.status = 403;
    throw err;
  }

  // Friend-request gate: 1:1 chats only exist between accepted friends.
  if (!(await areFriends(userId, peerUserId))) {
    const err = new Error("Send a friend request first");
    err.status = 403;
    throw err;
  }

  // Existing 1:1 chat? (Two members, exactly userId + peerUserId.)
  const existing = await prisma.chat.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: peerUserId } } },
      ],
    },
  });
  if (existing) return existing;

  return prisma.chat.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId },
          { userId: peerUserId },
        ],
      },
    },
  });
}
