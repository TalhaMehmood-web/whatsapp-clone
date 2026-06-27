import { prisma } from "./prisma.js";
import { destroyMedia } from "./upload.js";
import { triggerToChannel } from "./realtime/server.js";
import { channelChannel } from "./realtime/channels.js";
import {
  CHANNEL_MAX_ADMINS,
  CHANNEL_MAX_SUBSCRIBERS,
  CHANNEL_POST_INTERVAL_MS,
  CHANNEL_POST_REPLY_MAX,
  SOCKET_EVENT,
} from "@/config/constants";

const CHANNEL_SELECT = {
  id: true,
  name: true,
  handle: true,
  photo: true,
  description: true,
  ownerId: true,
  subscriberCount: true,
  createdAt: true,
};

// ─── Discovery + read paths ────────────────────────────────────────

export async function listChannels(userId) {
  const subs = await prisma.channelSubscriber.findMany({
    where: { userId },
    include: { channel: { select: CHANNEL_SELECT } },
    orderBy: { joinedAt: "desc" },
  });
  const mine = subs.map((s) => ({
    ...s.channel,
    mutedUntil: s.mutedUntil,
    isSubscribed: true,
  }));
  const subscribedIds = mine.map((c) => c.id);
  const suggested = await prisma.channel.findMany({
    where: subscribedIds.length ? { id: { notIn: subscribedIds } } : {},
    orderBy: { subscriberCount: "desc" },
    take: 20,
    select: CHANNEL_SELECT,
  });
  return {
    subscribed: mine,
    suggested: suggested.map((c) => ({ ...c, isSubscribed: false })),
  };
}

export async function getChannel({ userId, channelId }) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: CHANNEL_SELECT,
  });
  if (!channel) {
    const err = new Error("Channel not found");
    err.status = 404;
    throw err;
  }
  const [sub, admin] = await Promise.all([
    prisma.channelSubscriber.findUnique({
      where: { channelId_userId: { channelId, userId } },
    }),
    prisma.channelAdmin.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { id: true },
    }),
  ]);
  return {
    ...channel,
    isSubscribed: !!sub,
    mutedUntil: sub?.mutedUntil ?? null,
    isOwner: channel.ownerId === userId,
    isAdmin: !!admin || channel.ownerId === userId,
  };
}

export async function getChannelByHandle({ userId, handle }) {
  const channel = await prisma.channel.findUnique({
    where: { handle: handle.toLowerCase() },
    select: CHANNEL_SELECT,
  });
  if (!channel) return null;
  const [sub, admin] = await Promise.all([
    userId
      ? prisma.channelSubscriber.findUnique({
          where: { channelId_userId: { channelId: channel.id, userId } },
        })
      : Promise.resolve(null),
    userId
      ? prisma.channelAdmin.findUnique({
          where: { channelId_userId: { channelId: channel.id, userId } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  return {
    ...channel,
    isSubscribed: !!sub,
    mutedUntil: sub?.mutedUntil ?? null,
    isOwner: !!userId && channel.ownerId === userId,
    isAdmin: !!userId && (!!admin || channel.ownerId === userId),
  };
}

// /channels/explore — three surfaces in one round-trip:
//   - `trending`: top 12 by subscriberCount.
//   - `search`: handle/name LIKE q (only when q is set).
//   - `friends`: channels accepted friends subscribe to, with a count
//     of how many friends subscribe (sorts "most friends follow").
//
// We do the friend lookup once and reuse it. The whole call is meant
// to fit inside one route hit so the discover page loads in one GET.
export async function exploreChannels({ userId, q }) {
  const subscribedRows = await prisma.channelSubscriber.findMany({
    where: { userId },
    select: { channelId: true },
  });
  const subscribedIds = new Set(subscribedRows.map((r) => r.channelId));

  // Private channels are excluded from every discover surface — they
  // exist for invite-link-only audiences and shouldn't be ranked or
  // surfaced to non-members.
  const trendingPromise = prisma.channel.findMany({
    where: { isPrivate: false },
    orderBy: { subscriberCount: "desc" },
    take: 12,
    select: CHANNEL_SELECT,
  });

  const searchPromise = q
    ? prisma.channel.findMany({
        where: {
          isPrivate: false,
          OR: [
            { handle: { contains: q.toLowerCase() } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { subscriberCount: "desc" },
        take: 20,
        select: CHANNEL_SELECT,
      })
    : Promise.resolve([]);

  const friendsRows = await prisma.friendRequest.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ fromId: userId }, { toId: userId }],
    },
    select: { fromId: true, toId: true },
    take: 200,
  });
  const friendIds = friendsRows.map((r) =>
    r.fromId === userId ? r.toId : r.fromId,
  );
  const friendsSubsPromise = friendIds.length
    ? prisma.channelSubscriber.groupBy({
        by: ["channelId"],
        where: { userId: { in: friendIds } },
        _count: { channelId: true },
        orderBy: { _count: { channelId: "desc" } },
        take: 20,
      })
    : Promise.resolve([]);

  const [trending, search, friendsSubs] = await Promise.all([
    trendingPromise,
    searchPromise,
    friendsSubsPromise,
  ]);

  const friendsChannels = friendsSubs.length
    ? await prisma.channel.findMany({
        where: { id: { in: friendsSubs.map((s) => s.channelId) } },
        select: CHANNEL_SELECT,
      })
    : [];

  const friendsCountById = new Map(
    friendsSubs.map((s) => [s.channelId, s._count.channelId]),
  );

  const stamp = (channels) =>
    channels.map((c) => ({ ...c, isSubscribed: subscribedIds.has(c.id) }));

  return {
    trending: stamp(trending),
    search: stamp(search),
    friends: stamp(friendsChannels).map((c) => ({
      ...c,
      friendsCount: friendsCountById.get(c.id) ?? 0,
    })),
  };
}

// ─── Lifecycle ─────────────────────────────────────────────────────

export async function createChannel({
  userId,
  name,
  handle,
  photo,
  description,
}) {
  if (!name?.trim() || !handle?.trim()) {
    const err = new Error("Channel name and handle are required");
    err.status = 400;
    throw err;
  }
  const cleanHandle = handle.trim().toLowerCase().replace(/^@/, "");
  try {
    return await prisma.channel.create({
      data: {
        name: name.trim(),
        handle: cleanHandle,
        photo: photo ?? null,
        description: description ?? null,
        ownerId: userId,
        subscriberCount: 1,
        subscribers: { create: { userId } },
      },
      select: CHANNEL_SELECT,
    });
  } catch (err) {
    if (err.code === "P2002") {
      const e = new Error("Handle already taken");
      e.status = 409;
      throw e;
    }
    throw err;
  }
}

export async function updateChannel({ actorId, channelId, patch }) {
  // Admins can edit name / description / photo. Toggling private/public
  // is owner-only (separate route) because flipping a channel from
  // private → public exposes the whole subscriber list to discovery.
  await assertOwnerOrAdmin({ userId: actorId, channelId });
  const data = {};
  if (typeof patch.name === "string") data.name = patch.name.trim();
  if (typeof patch.description === "string") data.description = patch.description;
  if (patch.photo !== undefined) data.photo = patch.photo;
  return prisma.channel.update({
    where: { id: channelId },
    data,
    select: CHANNEL_SELECT,
  });
}

// Owner-only — exposed as a separate path because the private/public
// flip has real visibility consequences and shouldn't slip in via a
// generic PATCH payload.
export async function setChannelPrivacy({ actorId, channelId, isPrivate }) {
  await assertOwner({ userId: actorId, channelId });
  return prisma.channel.update({
    where: { id: channelId },
    data: { isPrivate: !!isPrivate },
    select: CHANNEL_SELECT,
  });
}

export async function deleteChannel({ actorId, channelId }) {
  await assertOwner({ userId: actorId, channelId });
  // Pull every post's Cloudinary asset BEFORE the cascade so we can
  // destroy them after. The cascade FK drops posts/reactions/replies/
  // subscribers automatically.
  const posts = await prisma.channelPost.findMany({
    where: { channelId },
    select: { mediaPublicId: true, mediaResource: true },
  });
  await prisma.channel.delete({ where: { id: channelId } });
  await Promise.all(
    posts.map((p) =>
      p.mediaPublicId
        ? destroyMedia({
            publicId: p.mediaPublicId,
            resourceType: p.mediaResource ?? "image",
          })
        : null,
    ),
  );
}

// ─── Subscriptions ────────────────────────────────────────────────

export async function subscribeChannel({ userId, channelId }) {
  // Cheap-and-correct: read the row, check the cap, increment counter
  // + insert in a transaction. Worst-case race is one over-cap entry;
  // acceptable on free tier.
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true, subscriberCount: true },
  });
  if (!channel) {
    const err = new Error("Channel not found");
    err.status = 404;
    throw err;
  }
  const existing = await prisma.channelSubscriber.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  if (existing) return; // idempotent

  if (channel.subscriberCount >= CHANNEL_MAX_SUBSCRIBERS) {
    const err = new Error(
      `Free-tier portfolio app — max ${CHANNEL_MAX_SUBSCRIBERS} subscribers per channel.`,
    );
    err.status = 413;
    throw err;
  }

  await prisma.$transaction([
    prisma.channelSubscriber.create({ data: { channelId, userId } }),
    prisma.channel.update({
      where: { id: channelId },
      data: { subscriberCount: { increment: 1 } },
    }),
  ]);
}

export async function unsubscribeChannel({ userId, channelId }) {
  const existing = await prisma.channelSubscriber.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  if (!existing) return;
  await prisma.$transaction([
    prisma.channelSubscriber.delete({
      where: { channelId_userId: { channelId, userId } },
    }),
    prisma.channel.update({
      where: { id: channelId },
      data: { subscriberCount: { decrement: 1 } },
    }),
  ]);
}

export async function setChannelMute({ userId, channelId, mutedUntil }) {
  const sub = await prisma.channelSubscriber.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  if (!sub) {
    const err = new Error("Not subscribed");
    err.status = 404;
    throw err;
  }
  await prisma.channelSubscriber.update({
    where: { channelId_userId: { channelId, userId } },
    data: { mutedUntil: mutedUntil ?? null },
  });
}

// ─── Posts ─────────────────────────────────────────────────────────

const POST_INCLUDE = {
  author: { select: { id: true, name: true, avatar: true } },
  reactions: { select: { userId: true, emoji: true } },
  _count: { select: { replies: true } },
};

export async function listChannelPosts({
  userId,
  channelId,
  cursor,
  limit = 20,
}) {
  await assertSubscribedOrOwner({ userId, channelId });
  const posts = await prisma.channelPost.findMany({
    where: {
      channelId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: POST_INCLUDE,
  });
  return {
    posts,
    nextCursor:
      posts.length === limit
        ? posts[posts.length - 1].createdAt
        : null,
  };
}

// In-memory per-author rate limit. Same shape as the typing throttle.
// Worst-case across concurrent function instances is a few extra posts;
// not worth a Redis dependency on the free tier.
const lastPostAt = new Map();

export async function createChannelPost({
  authorId,
  channelId,
  content,
  type,
  mediaUrl,
  mediaMime,
  mediaThumbUrl,
  mediaSizeBytes,
  mediaDuration,
  fileName,
  mediaPublicId,
  mediaResource,
}) {
  // Owner or any admin can author posts. assertOwnerOrAdmin returns
  // the role label which we use as the rate-limit key — admins each
  // get their own 1/min budget rather than sharing the owner's.
  await assertOwnerOrAdmin({ userId: authorId, channelId });

  const now = Date.now();
  const key = `${authorId}:${channelId}`;
  const last = lastPostAt.get(key) ?? 0;
  if (now - last < CHANNEL_POST_INTERVAL_MS) {
    const err = new Error("You're posting too fast. Try again in a moment.");
    err.status = 429;
    throw err;
  }

  if (!content?.trim() && !mediaUrl) {
    const err = new Error("Post must have text or media");
    err.status = 400;
    throw err;
  }

  const post = await prisma.channelPost.create({
    data: {
      channelId,
      authorId,
      content: content?.trim() || null,
      type: type ?? "TEXT",
      mediaUrl: mediaUrl ?? null,
      mediaMime: mediaMime ?? null,
      mediaThumbUrl: mediaThumbUrl ?? null,
      mediaSizeBytes: mediaSizeBytes ?? null,
      mediaDuration: mediaDuration ?? null,
      fileName: fileName ?? null,
      mediaPublicId: mediaPublicId ?? null,
      mediaResource: mediaResource ?? null,
    },
    include: POST_INCLUDE,
  });

  lastPostAt.set(key, now);

  await triggerToChannel(
    channelChannel(channelId),
    SOCKET_EVENT.CHANNEL_POST_NEW,
    post,
  );

  return post;
}

export async function deleteChannelPost({ actorId, postId }) {
  const post = await prisma.channelPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      channelId: true,
      authorId: true,
      mediaPublicId: true,
      mediaResource: true,
    },
  });
  if (!post) {
    const err = new Error("Post not found");
    err.status = 404;
    throw err;
  }
  // Owner can delete any post; admins can delete only the ones they
  // authored. Prevents an admin from purging the owner's history.
  if (post.authorId !== actorId) {
    await assertOwner({ userId: actorId, channelId: post.channelId });
  } else {
    await assertOwnerOrAdmin({ userId: actorId, channelId: post.channelId });
  }

  await prisma.channelPost.delete({ where: { id: postId } });

  if (post.mediaPublicId) {
    destroyMedia({
      publicId: post.mediaPublicId,
      resourceType: post.mediaResource ?? "image",
    });
  }

  await triggerToChannel(
    channelChannel(post.channelId),
    SOCKET_EVENT.CHANNEL_POST_DELETED,
    { postId: post.id, channelId: post.channelId },
  );
}

// ─── Reactions ─────────────────────────────────────────────────────

export async function toggleChannelPostReaction({ userId, postId, emoji }) {
  if (!emoji) {
    const err = new Error("Emoji required");
    err.status = 400;
    throw err;
  }
  const post = await prisma.channelPost.findUnique({
    where: { id: postId },
    select: { id: true, channelId: true },
  });
  if (!post) {
    const err = new Error("Post not found");
    err.status = 404;
    throw err;
  }
  await assertSubscribedOrOwner({ userId, channelId: post.channelId });

  const existing = await prisma.channelPostReaction.findUnique({
    where: { postId_userId_emoji: { postId, userId, emoji } },
  });
  if (existing) {
    await prisma.channelPostReaction.delete({
      where: { postId_userId_emoji: { postId, userId, emoji } },
    });
  } else {
    await prisma.channelPostReaction.create({
      data: { postId, userId, emoji },
    });
  }
  const reactions = await prisma.channelPostReaction.findMany({
    where: { postId },
    select: { userId: true, emoji: true },
  });
  await triggerToChannel(
    channelChannel(post.channelId),
    SOCKET_EVENT.CHANNEL_POST_REACTION,
    { postId, reactions },
  );
  return reactions;
}

// ─── Threaded replies ──────────────────────────────────────────────

export async function listChannelPostReplies({ userId, postId }) {
  const post = await prisma.channelPost.findUnique({
    where: { id: postId },
    select: { channelId: true },
  });
  if (!post) {
    const err = new Error("Post not found");
    err.status = 404;
    throw err;
  }
  await assertSubscribedOrOwner({ userId, channelId: post.channelId });
  return prisma.channelPostReply.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  });
}

export async function createChannelPostReply({
  authorId,
  postId,
  content,
}) {
  const text = content?.trim();
  if (!text) {
    const err = new Error("Reply text required");
    err.status = 400;
    throw err;
  }
  const post = await prisma.channelPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      channelId: true,
      authorId: true,
      _count: { select: { replies: true } },
    },
  });
  if (!post) {
    const err = new Error("Post not found");
    err.status = 404;
    throw err;
  }
  await assertSubscribedOrOwner({ userId: authorId, channelId: post.channelId });

  if (post._count.replies >= CHANNEL_POST_REPLY_MAX) {
    const err = new Error(
      `Max ${CHANNEL_POST_REPLY_MAX} replies per post on the free tier.`,
    );
    err.status = 413;
    throw err;
  }

  const reply = await prisma.channelPostReply.create({
    data: { postId, authorId, content: text },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  });

  // We emit on the channel room (cheap — 1 event per channel) and
  // include `recipientIds` in the payload. The client-side sync hook
  // checks the user id before patching its cache so non-participants
  // don't see a phantom reply. This avoids a per-user fanout that
  // would burn the event budget on busy channels.
  const replies = await prisma.channelPostReply.findMany({
    where: { postId },
    select: { authorId: true },
    distinct: ["authorId"],
  });
  const recipients = new Set([
    post.authorId,
    ...replies.map((r) => r.authorId),
  ]);
  recipients.delete(authorId);

  await triggerToChannel(
    channelChannel(post.channelId),
    SOCKET_EVENT.CHANNEL_POST_REPLY,
    { postId, reply, recipientIds: Array.from(recipients) },
  );
  return reply;
}

// ─── Admins ───────────────────────────────────────────────────────
// Owner is implicit and not stored on ChannelAdmin. The list returns
// (owner first) + admins so the UI can render a unified "people who
// manage this channel" strip without merging client-side.

export async function listChannelAdmins({ userId, channelId }) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: {
      ownerId: true,
      owner: { select: { id: true, name: true, avatar: true, handle: true } },
      admins: {
        include: {
          user: { select: { id: true, name: true, avatar: true, handle: true } },
        },
        orderBy: { addedAt: "asc" },
      },
    },
  });
  if (!channel) {
    const err = new Error("Channel not found");
    err.status = 404;
    throw err;
  }
  // Anyone subscribed can see the admin roster. Owners + admins of
  // course can too.
  await assertSubscribedOrOwner({ userId, channelId });
  return {
    owner: channel.owner,
    admins: channel.admins.map((a) => a.user),
  };
}

// Owner-only. Caps at 5 admins. Idempotent — re-adding an existing
// admin is a noop. We never demote the owner via this path (they're
// implicit, not in the join table).
export async function addChannelAdmin({ actorId, channelId, targetUserId }) {
  await assertOwner({ userId: actorId, channelId });
  if (!targetUserId) {
    const err = new Error("targetUserId is required");
    err.status = 400;
    throw err;
  }
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { ownerId: true, _count: { select: { admins: true } } },
  });
  if (channel.ownerId === targetUserId) {
    // No-op: owner already has every permission.
    return;
  }
  if (channel._count.admins >= CHANNEL_MAX_ADMINS) {
    const err = new Error(
      `Free-tier portfolio app — max ${CHANNEL_MAX_ADMINS} admins per channel.`,
    );
    err.status = 413;
    throw err;
  }
  await prisma.channelAdmin.upsert({
    where: { channelId_userId: { channelId, userId: targetUserId } },
    update: {},
    create: { channelId, userId: targetUserId },
  });
}

// Owner-only. Removing the owner is a no-op (they're not in the table).
export async function removeChannelAdmin({
  actorId,
  channelId,
  targetUserId,
}) {
  await assertOwner({ userId: actorId, channelId });
  await prisma.channelAdmin
    .delete({
      where: { channelId_userId: { channelId, userId: targetUserId } },
    })
    .catch(() => {});
}

// Owner-only. Two writes in a transaction so we never end up with two
// owners or none. The previous owner is demoted to admin (if there's
// room — over the cap they just get dropped).
export async function transferChannelOwnership({
  actorId,
  channelId,
  targetUserId,
}) {
  await assertOwner({ userId: actorId, channelId });
  if (!targetUserId || targetUserId === actorId) {
    const err = new Error("Pick a different user to transfer to.");
    err.status = 400;
    throw err;
  }
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { _count: { select: { admins: true } } },
  });
  await prisma.$transaction(async (tx) => {
    // Promote target to owner.
    await tx.channel.update({
      where: { id: channelId },
      data: { ownerId: targetUserId },
    });
    // Target stops being a regular admin (they're now owner-implicit).
    await tx.channelAdmin
      .delete({
        where: { channelId_userId: { channelId, userId: targetUserId } },
      })
      .catch(() => {});
    // Previous owner becomes a regular admin — if we have room. If the
    // admin cap is already maxed (5), we just leave them with no role
    // because creating a 6th admin would violate our own invariant.
    if (channel._count.admins < CHANNEL_MAX_ADMINS) {
      await tx.channelAdmin.upsert({
        where: { channelId_userId: { channelId, userId: actorId } },
        update: {},
        create: { channelId, userId: actorId },
      });
    }
  });
}

// ─── Subscribers list with privacy gating (CH3) ──────────────────
// Owners + admins see every subscriber. Everyone else sees only the
// caller's accepted-friend overlap. This is the closest analog to
// WhatsApp's "contacts or admins" rule given that we don't have
// phone-book contacts; accepted friends are the friend equivalent.

export async function listChannelSubscribers({ userId, channelId }) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: {
      ownerId: true,
      admins: { select: { userId: true } },
    },
  });
  if (!channel) {
    const err = new Error("Channel not found");
    err.status = 404;
    throw err;
  }
  const adminIds = new Set([
    channel.ownerId,
    ...channel.admins.map((a) => a.userId),
  ]);
  const isManager = adminIds.has(userId);

  const subscribers = await prisma.channelSubscriber.findMany({
    where: { channelId },
    include: {
      user: { select: { id: true, name: true, avatar: true, handle: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  if (isManager) {
    return { subscribers: subscribers.map((s) => s.user), gated: false };
  }

  // Non-manager: intersect with accepted friends so we never leak the
  // identity of strangers.
  const friends = await prisma.friendRequest.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ fromId: userId }, { toId: userId }],
    },
    select: { fromId: true, toId: true },
  });
  const friendIds = new Set(
    friends.map((f) => (f.fromId === userId ? f.toId : f.fromId)),
  );
  const filtered = subscribers
    .filter((s) => friendIds.has(s.userId) || s.userId === userId)
    .map((s) => s.user);
  return { subscribers: filtered, gated: true };
}

// ─── Reports (CH2) ───────────────────────────────────────────────
// One row per (user, channel). Idempotent — re-reporting just refreshes
// the `reason` if a new one is provided. No moderation hook yet; the
// row stays in the DB for a future dashboard.

export async function reportChannel({ userId, channelId, reason }) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { id: true, ownerId: true },
  });
  if (!channel) {
    const err = new Error("Channel not found");
    err.status = 404;
    throw err;
  }
  if (channel.ownerId === userId) {
    const err = new Error("You can't report a channel you own.");
    err.status = 400;
    throw err;
  }
  const clean = typeof reason === "string" ? reason.slice(0, 280) : null;
  await prisma.channelReport.upsert({
    where: { channelId_userId: { channelId, userId } },
    update: { reason: clean },
    create: { channelId, userId, reason: clean },
  });
}

// ─── Guards ───────────────────────────────────────────────────────

async function assertOwner({ userId, channelId }) {
  const c = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { ownerId: true },
  });
  if (!c) {
    const err = new Error("Channel not found");
    err.status = 404;
    throw err;
  }
  if (c.ownerId !== userId) {
    const err = new Error("Only the channel owner can do that.");
    err.status = 403;
    throw err;
  }
}

// Owner OR co-admin. Used by post-create + channel metadata edit so
// admins have authorial reach without owner-level destructive power.
async function assertOwnerOrAdmin({ userId, channelId }) {
  const [channel, admin] = await Promise.all([
    prisma.channel.findUnique({
      where: { id: channelId },
      select: { ownerId: true },
    }),
    prisma.channelAdmin.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { id: true },
    }),
  ]);
  if (!channel) {
    const err = new Error("Channel not found");
    err.status = 404;
    throw err;
  }
  if (channel.ownerId === userId || admin) return;
  const err = new Error("Only the owner or an admin can do that.");
  err.status = 403;
  throw err;
}

async function assertSubscribedOrOwner({ userId, channelId }) {
  const [channel, sub] = await Promise.all([
    prisma.channel.findUnique({
      where: { id: channelId },
      select: { ownerId: true },
    }),
    prisma.channelSubscriber.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { id: true },
    }),
  ]);
  if (!channel) {
    const err = new Error("Channel not found");
    err.status = 404;
    throw err;
  }
  if (channel.ownerId === userId || sub) return;
  const err = new Error("Subscribe to view this channel.");
  err.status = 403;
  throw err;
}
