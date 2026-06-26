import { prisma } from "./prisma.js";
import { emitToChat, emitToUser } from "./socket-server.js";
import { destroyMedia } from "./upload.js";
import { sendPushTo } from "./push.js";
import { isBlockedBetween } from "./block.js";
import { areFriends } from "./friend-requests.js";
import { previewText } from "@/utils/message-format";
import { PAGE_SIZE, ROUTES, SOCKET_EVENT } from "@/config/constants";
import { MessageType, ReceiptStatus } from "@/models/enums";

// Read messages oldest→newest within a chat. The API caller treats the
// `nextCursor` as opaque — it's just the createdAt of the oldest message in
// the current page. Pass it back as `before` to load the previous page.
export async function getMessages({ chatId, userId, before, limit = PAGE_SIZE.MESSAGES }) {
  await assertMembership(chatId, userId);

  // Honour the per-user "Clear chat" cutoff + the per-user "Delete for
  // me" hidden rows. Messages with `deletedAt` (deleted for everyone)
  // stay so the tombstone keeps rendering across refreshes.
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: { clearedAt: true },
  });
  const hidden = await prisma.messageHidden.findMany({
    where: { userId, message: { chatId } },
    select: { messageId: true },
  });
  const hiddenIds = hidden.map((h) => h.messageId);

  const messages = await prisma.message.findMany({
    where: {
      chatId,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      ...(membership?.clearedAt
        ? { createdAt: { gt: membership.clearedAt } }
        : {}),
      ...(hiddenIds.length > 0 ? { id: { notIn: hiddenIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      sender: {
        select: { id: true, name: true, avatar: true },
      },
      replyTo: {
        select: { id: true, content: true, type: true, senderId: true },
      },
      reactions: true,
      receipts: true,
      // Only pull this user's star row so the bubble can show the star
      // icon next to the timestamp. Everyone else's stars stay private.
      starredBy: { where: { userId }, select: { userId: true } },
    },
  });

  // We fetched newest-first for the cursor; flip back to oldest-first for the UI.
  const ordered = [...messages].reverse();
  const nextCursor =
    messages.length === limit ? messages[messages.length - 1].createdAt : null;

  return { messages: ordered, nextCursor };
}

export async function createMessage({
  chatId,
  senderId,
  content,
  type = MessageType.TEXT,
  mediaUrl,
  mediaMime,
  mediaThumbUrl,
  mediaSizeBytes,
  mediaDuration,
  mediaPublicId,
  mediaResource,
  fileName,
  caption,
  replyToId,
  metadata,
}) {
  await assertMembership(chatId, senderId);
  await assertNotBlockedFor1on1(chatId, senderId);

  // Honour the chat's disappearing-messages TTL by stamping expiresAt on
  // outgoing rows. Server-side eviction is a separate cron — here we
  // just record when the row should disappear.
  const chatForTtl = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { disappearingSeconds: true },
  });
  const expiresAt = chatForTtl?.disappearingSeconds
    ? new Date(Date.now() + chatForTtl.disappearingSeconds * 1000)
    : null;

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        chatId,
        senderId,
        content,
        type,
        mediaUrl,
        mediaMime,
        mediaThumbUrl,
        mediaSizeBytes,
        mediaDuration,
        mediaPublicId,
        mediaResource,
        fileName,
        caption,
        replyToId,
        expiresAt,
        metadata: metadata ?? undefined,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        replyTo: {
          select: { id: true, content: true, type: true, senderId: true },
        },
        reactions: true,
        receipts: true,
      },
    });

    // Touch chat updatedAt so the list re-sorts.
    await tx.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Bump unread count for every peer; reset for the sender.
    await tx.chatMember.updateMany({
      where: { chatId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });
    await tx.chatMember.update({
      where: { chatId_userId: { chatId, userId: senderId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });

    // Seed SENT receipts for every member (incl. sender — they "read" their own).
    const members = await tx.chatMember.findMany({
      where: { chatId },
      select: { userId: true },
    });
    await tx.messageReceipt.createMany({
      data: members.map(({ userId }) => ({
        messageId: created.id,
        userId,
        status:
          userId === senderId ? ReceiptStatus.READ : ReceiptStatus.SENT,
        deliveredAt: userId === senderId ? new Date() : null,
        seenAt: userId === senderId ? new Date() : null,
      })),
      skipDuplicates: true,
    });

    return created;
  });

  // Fan-out: every member receives the event on their personal user room
  // so peers who aren't currently viewing the chat still get the live
  // update (badge + sort-to-top in the chat list, notifications, etc.).
  // `chat:<id>` is still in play so anyone *in* the room hears it once,
  // and Socket.IO deduplicates inside a single connection.
  emitToChat(chatId, SOCKET_EVENT.MESSAGE_NEW, message);
  const members = await prisma.chatMember.findMany({
    where: { chatId },
    select: { userId: true },
  });
  for (const { userId } of members) {
    if (userId === senderId) continue;
    emitToUser(userId, SOCKET_EVENT.MESSAGE_NEW, message);
  }

  // Fire-and-forget Web Push to every peer who isn't the sender. We don't
  // await this — push failures shouldn't slow the API response.
  pushToPeers(message).catch((err) =>
    console.error("push fanout failed", err),
  );

  return message;
}

async function pushToPeers(message) {
  // Resolve the recipient list AND each recipient's notification kind
  // toggles + the chat's `isGroup` flag in one shot. Server-side
  // enforcement: when "Messages" is off (or "Groups" off for a group
  // chat), we skip the push entirely — the toggle isn't just for
  // hiding the OS-level banner, it stops the wire send.
  const [members, chat] = await Promise.all([
    prisma.chatMember.findMany({
      where: { chatId: message.chatId, userId: { not: message.senderId } },
      select: {
        userId: true,
        user: {
          select: {
            notifPrefs: {
              select: { messages: true, groups: true },
            },
          },
        },
      },
    }),
    prisma.chat.findUnique({
      where: { id: message.chatId },
      select: { isGroup: true },
    }),
  ]);
  const senderName = message.sender?.name ?? "New message";
  const body = previewText(message) || "Sent you a message";
  const isGroup = !!chat?.isGroup;

  await Promise.all(
    members.map((m) => {
      const prefs = m.user?.notifPrefs;
      // Defaults match the schema (messages on, groups on) so users who
      // have never visited the screen still get pushes.
      const wantsMessages = prefs?.messages ?? true;
      const wantsGroups = prefs?.groups ?? true;
      if (!wantsMessages) return undefined;
      if (isGroup && !wantsGroups) return undefined;
      return sendPushTo({
        userId: m.userId,
        payload: {
          title: senderName,
          body,
          tag: `chat:${message.chatId}`,
          url: ROUTES.CHAT_DETAIL(message.chatId),
        },
      });
    }),
  );
}

async function assertMembership(chatId, userId) {
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

// In a 1:1 chat the send is rejected if either side has blocked the other
// OR if the two users are no longer accepted friends. Group chats are
// unaffected — matches WhatsApp behavior.
async function assertNotBlockedFor1on1(chatId, senderId) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: {
      isGroup: true,
      members: { select: { userId: true } },
    },
  });
  if (!chat || chat.isGroup) return;
  const peer = chat.members.find((m) => m.userId !== senderId);
  if (!peer) return;
  if (await isBlockedBetween(senderId, peer.userId)) {
    const err = new Error("You can't message this contact");
    err.status = 403;
    throw err;
  }
  if (!(await areFriends(senderId, peer.userId))) {
    const err = new Error("You're no longer friends with this contact");
    err.status = 403;
    throw err;
  }
}

// ─── Star ──────────────────────────────────────────────────────────────────

// Returns the media catalog for a chat, split into the three tabs the UI
// shows: { media, docs, links }. `media` includes both IMAGE and VIDEO so
// the gallery thumbnail grid is mixed.
//
// `links` is extracted from message text (any http/https URL). We intentionally
// pull the most recent 200 messages for that pass — older URLs are rare and
// blocking on the full chat history isn't worth it.
export async function listChatMedia({ chatId, userId }) {
  await assertMembership(chatId, userId);

  const [media, docs, recent] = await Promise.all([
    prisma.message.findMany({
      where: {
        chatId,
        deletedAt: null,
        type: { in: [MessageType.IMAGE, MessageType.VIDEO] },
        mediaUrl: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.message.findMany({
      where: {
        chatId,
        deletedAt: null,
        type: MessageType.DOCUMENT,
        mediaUrl: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.message.findMany({
      where: {
        chatId,
        deletedAt: null,
        content: { contains: "http" },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    }),
  ]);

  const URL_RX = /(https?:\/\/[^\s]+)/gi;
  const links = recent
    .flatMap((m) => {
      const matches = m.content?.match(URL_RX) ?? [];
      return matches.map((url) => ({
        id: `${m.id}:${url}`,
        messageId: m.id,
        url,
        createdAt: m.createdAt,
        sender: m.sender,
      }));
    })
    .slice(0, 100);

  return { media, docs, links };
}

export async function starMessage({ userId, messageId, value }) {
  await assertMessageMembership(userId, messageId);
  if (value) {
    await prisma.starredMessage.upsert({
      where: { userId_messageId: { userId, messageId } },
      update: {},
      create: { userId, messageId },
    });
  } else {
    await prisma.starredMessage
      .delete({ where: { userId_messageId: { userId, messageId } } })
      .catch(() => {});
  }
}

export async function listStarred(userId) {
  const rows = await prisma.starredMessage.findMany({
    where: { userId },
    orderBy: { starredAt: "desc" },
    take: 200,
    include: {
      message: {
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          chat: { select: { id: true, name: true, photo: true, isGroup: true } },
        },
      },
    },
  });
  return rows.map((r) => ({
    starredAt: r.starredAt,
    message: r.message,
    chat: r.message.chat,
  }));
}

// ─── Edit / Delete / Forward ───────────────────────────────────────────────

export async function editMessage({ userId, messageId, content }) {
  const msg = await assertOwnership(userId, messageId);
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content, editedAt: new Date() },
    include: { reactions: true, receipts: true },
  });
  emitToChat(msg.chatId, SOCKET_EVENT.MESSAGE_EDITED, updated);
  return updated;
}

// Three modes, matching WhatsApp's prompt:
//   - "everyone" → only the sender; tombstones the row (deletedAt set,
//                  content + mediaUrl wiped) and fans MESSAGE_DELETED
//                  so peers see "This message was deleted".
//   - "me"       → anyone in the chat; inserts a MessageHidden row so the
//                  message is filtered out for that one viewer. No
//                  broadcast — peers see no change.
//   - "purge"    → only the sender, only on already-tombstoned rows.
//                  Hard-deletes the Message row from the database and
//                  fans MESSAGE_PURGED so every viewer's tombstone pill
//                  disappears too. Used when the sender right-clicks the
//                  "This message was deleted" pill and picks Delete.
export async function deleteMessage({ userId, messageId, mode = "everyone" }) {
  if (mode === "purge") {
    const msg = await assertOwnership(userId, messageId);
    if (!msg.deletedAt) {
      const err = new Error("Message must be deleted-for-everyone first");
      err.status = 400;
      throw err;
    }
    await prisma.message.delete({ where: { id: messageId } });
    emitToChat(msg.chatId, SOCKET_EVENT.MESSAGE_PURGED, {
      id: messageId,
      chatId: msg.chatId,
    });
    return { id: messageId, chatId: msg.chatId, mode: "purge" };
  }
  if (mode === "me") {
    // The viewer must be a chat member; senders can also use this to
    // hide their own messages locally without retracting from peers.
    const msg = await assertMessageMembership(userId, messageId);
    await prisma.messageHidden.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId },
      update: {},
    });
    return { chatId: msg.chatId, id: messageId, mode: "me" };
  }
  const msg = await assertOwnership(userId, messageId);
  // Fetch the asset identifiers before we wipe them — destroy AFTER the
  // DB tombstone so a CDN failure can't desync state.
  const before = await prisma.message.findUnique({
    where: { id: messageId },
    select: { mediaPublicId: true, mediaResource: true },
  });
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      deletedAt: new Date(),
      content: null,
      mediaUrl: null,
      mediaThumbUrl: null,
      mediaPublicId: null,
      mediaResource: null,
    },
  });
  if (before?.mediaPublicId) {
    // Fire-and-forget; logged on failure inside destroyMedia.
    destroyMedia({
      publicId: before.mediaPublicId,
      resourceType: before.mediaResource ?? "image",
    });
  }
  emitToChat(msg.chatId, SOCKET_EVENT.MESSAGE_DELETED, {
    id: updated.id,
    chatId: updated.chatId,
  });
  return updated;
}

// Pin / unpin a message inside a chat. WhatsApp Web caps the active pin
// count at 3 — pinning a 4th evicts the oldest one. We model each pin
// as its own PinnedMessage row so the banner can cycle through the stack.
//
// Returns the chat's current pinned message ids (newest first) so the
// caller can patch caches immediately.
const MAX_PINS_PER_CHAT = 3;

export async function setPinnedMessage({ userId, messageId, value }) {
  const msg = await assertMessageMembership(userId, messageId);
  const { chatId } = msg;

  if (value) {
    // Adding the pin is idempotent. After the upsert we check whether the
    // chat is now over the cap and drop the oldest extras.
    await prisma.pinnedMessage.upsert({
      where: { chatId_messageId: { chatId, messageId } },
      create: { chatId, messageId, pinnedBy: userId },
      update: {},
    });
    const existing = await prisma.pinnedMessage.findMany({
      where: { chatId },
      orderBy: { pinnedAt: "desc" },
      select: { id: true },
    });
    if (existing.length > MAX_PINS_PER_CHAT) {
      const drop = existing.slice(MAX_PINS_PER_CHAT).map((p) => p.id);
      await prisma.pinnedMessage.deleteMany({
        where: { id: { in: drop } },
      });
    }
  } else {
    await prisma.pinnedMessage
      .delete({ where: { chatId_messageId: { chatId, messageId } } })
      .catch(() => {});
  }

  const remaining = await prisma.pinnedMessage.findMany({
    where: { chatId },
    orderBy: { pinnedAt: "desc" },
    select: { messageId: true },
  });
  const pinnedMessageIds = remaining.map((p) => p.messageId);

  emitToChat(chatId, SOCKET_EVENT.MESSAGE_PINNED, {
    chatId,
    pinnedMessageIds,
  });
  return pinnedMessageIds;
}

// File a per-user report against a message. Idempotent — a second report
// from the same user updates the reason instead of duplicating the row.
export async function reportMessage({ userId, messageId, reason }) {
  await assertMessageMembership(userId, messageId);
  await prisma.messageReport.upsert({
    where: { messageId_reporterId: { messageId, reporterId: userId } },
    create: { messageId, reporterId: userId, reason: reason ?? null },
    update: { reason: reason ?? null },
  });
}

export async function forwardMessage({ userId, messageId, chatIds }) {
  if (!Array.isArray(chatIds) || chatIds.length === 0) {
    const err = new Error("chatIds is required");
    err.status = 400;
    throw err;
  }
  const original = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: { select: { name: true } },
    },
  });
  if (!original) {
    const err = new Error("Message not found");
    err.status = 404;
    throw err;
  }

  const out = [];
  for (const chatId of chatIds) {
    const created = await createMessage({
      chatId,
      senderId: userId,
      content: original.content,
      type: original.type,
      mediaUrl: original.mediaUrl,
      mediaMime: original.mediaMime,
      mediaThumbUrl: original.mediaThumbUrl,
      mediaSizeBytes: original.mediaSizeBytes,
      mediaDuration: original.mediaDuration,
      fileName: original.fileName,
      caption: original.caption,
    });
    // Mark the forwarded copy so the bubble can render the "Forwarded" pill.
    await prisma.message.update({
      where: { id: created.id },
      data: {
        forwardedFrom: original.sender?.name ?? null,
        forwardCount: (original.forwardCount ?? 0) + 1,
      },
    });
    out.push(created);
  }
  return out;
}

async function assertMessageMembership(userId, messageId) {
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: { chatId: true },
  });
  if (!msg) {
    const err = new Error("Message not found");
    err.status = 404;
    throw err;
  }
  await assertMembership(msg.chatId, userId);
  return msg;
}

async function assertOwnership(userId, messageId) {
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: { chatId: true, senderId: true, deletedAt: true },
  });
  if (!msg) {
    const err = new Error("Message not found");
    err.status = 404;
    throw err;
  }
  if (msg.senderId !== userId) {
    const err = new Error("Only the sender can edit or delete this message");
    err.status = 403;
    throw err;
  }
  return msg;
}
