import { prisma } from "./prisma.js";
import { listFriends } from "./friend-requests.js";
import { StatusType } from "@/models/enums";

const STATUS_TTL_MS = 24 * 60 * 60 * 1000;

// Returns { mine: Status[], contacts: ContactGroup[] }.
// Only accepted friends count as contacts — matches the friend-request
// gating used everywhere else in the app.
export async function listStatuses(userId) {
  const now = new Date();

  const mine = await prisma.status.findMany({
    where: { userId, expiresAt: { gt: now } },
    orderBy: { createdAt: "asc" },
    include: { views: true },
  });

  const friends = await listFriends(userId);
  if (friends.length === 0) return { mine, contacts: [] };
  const peerIds = friends.map((f) => f.id);

  const peerStatuses = await prisma.status.findMany({
    where: { userId: { in: peerIds }, expiresAt: { gt: now } },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, handle: true },
      },
      views: { where: { userId } },
    },
  });

  // Group by author, mark whether the current user has viewed every status.
  const byAuthor = new Map();
  for (const s of peerStatuses) {
    const bucket = byAuthor.get(s.userId) ?? {
      user: s.user,
      statuses: [],
      allViewed: true,
    };
    bucket.statuses.push(s);
    if (s.views.length === 0) bucket.allViewed = false;
    byAuthor.set(s.userId, bucket);
  }

  // Sort by most recent author activity. The UI splits into Recent vs
  // Viewed buckets by reading `allViewed`.
  const contacts = [...byAuthor.values()]
    .map((b) => ({
      ...b,
      latestAt: b.statuses[b.statuses.length - 1].createdAt,
    }))
    .sort((a, b) => new Date(b.latestAt) - new Date(a.latestAt));

  return { mine, contacts };
}

// Fetch the author's full status reel for the viewer. Caller must be
// either the author or a friend (gated below).
export async function listStatusesByAuthor({ viewerId, authorId }) {
  if (viewerId !== authorId) {
    const friends = await listFriends(viewerId);
    const friendIds = new Set(friends.map((f) => f.id));
    if (!friendIds.has(authorId)) {
      const err = new Error("Not allowed to view this status");
      err.status = 403;
      throw err;
    }
  }
  const now = new Date();
  const statuses = await prisma.status.findMany({
    where: { userId: authorId, expiresAt: { gt: now } },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, handle: true },
      },
      views: viewerId === authorId ? { include: { user: { select: { id: true, name: true, avatar: true, handle: true } } } } : { where: { userId: viewerId } },
    },
  });
  return statuses;
}

export async function createStatus({
  userId,
  type = StatusType.TEXT,
  content,
  bgColor,
  font,
  mediaUrl,
  mediaMime,
  mediaDuration,
  caption,
}) {
  if (type === StatusType.TEXT && !content?.trim()) {
    const err = new Error("Status text is required");
    err.status = 400;
    throw err;
  }
  if (type !== StatusType.TEXT && !mediaUrl) {
    const err = new Error("Media URL is required");
    err.status = 400;
    throw err;
  }
  return prisma.status.create({
    data: {
      userId,
      type,
      content: content ?? null,
      bgColor: bgColor ?? null,
      font: font ?? null,
      mediaUrl: mediaUrl ?? null,
      mediaMime: mediaMime ?? null,
      mediaDuration: mediaDuration ?? null,
      caption: caption ?? null,
      expiresAt: new Date(Date.now() + STATUS_TTL_MS),
    },
  });
}

export async function viewStatus({ userId, statusId }) {
  // Don't record self-views — they'd show up in the viewers sheet.
  const status = await prisma.status.findUnique({
    where: { id: statusId },
    select: { userId: true },
  });
  if (!status) {
    const err = new Error("Status not found");
    err.status = 404;
    throw err;
  }
  if (status.userId === userId) return;
  await prisma.statusView.upsert({
    where: { statusId_userId: { statusId, userId } },
    update: {},
    create: { statusId, userId },
  });
}

// Only the author can see who watched a given status.
export async function listViewers({ userId, statusId }) {
  const status = await prisma.status.findUnique({
    where: { id: statusId },
    select: { userId: true },
  });
  if (!status) {
    const err = new Error("Status not found");
    err.status = 404;
    throw err;
  }
  if (status.userId !== userId) {
    const err = new Error("Not allowed to see viewers");
    err.status = 403;
    throw err;
  }
  return prisma.statusView.findMany({
    where: { statusId },
    orderBy: { viewedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatar: true, handle: true } },
    },
  });
}

export async function deleteStatus({ userId, statusId }) {
  const s = await prisma.status.findUnique({ where: { id: statusId } });
  if (!s || s.userId !== userId) {
    const err = new Error("Status not found");
    err.status = 404;
    throw err;
  }
  await prisma.status.delete({ where: { id: statusId } });
}
