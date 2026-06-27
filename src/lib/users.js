import { prisma } from "./prisma";
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from "./auth";
import { relationshipWith } from "./friend-requests.js";
import { applyDerivedPresence } from "./presence.js";

const PUBLIC_USER_SELECT = {
  id: true,
  handle: true,
  name: true,
  email: true,
  phone: true,
  avatar: true,
  about: true,
  lastSeen: true,
  isOnline: true,
  securityNotifications: true,
  createdAt: true,
};

export class AuthError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function registerUser({
  name,
  handle,
  email,
  phone,
  password,
}) {
  const normalisedEmail = email?.trim().toLowerCase() || null;
  const normalisedPhone = phone?.trim() || null;
  const normalisedHandle = handle?.trim().toLowerCase() || null;

  if (!normalisedHandle) {
    throw new AuthError("Username is required", 400);
  }
  if (!/^[a-z0-9_.]{3,24}$/.test(normalisedHandle)) {
    throw new AuthError(
      "Username can be 3–24 characters of letters, numbers, dot or underscore",
      400,
    );
  }

  if (normalisedEmail) {
    const existing = await prisma.user.findUnique({
      where: { email: normalisedEmail },
    });
    if (existing) throw new AuthError("Email already in use", 409);
  }
  if (normalisedPhone) {
    const existing = await prisma.user.findUnique({
      where: { phone: normalisedPhone },
    });
    if (existing) throw new AuthError("Phone already in use", 409);
  }
  const handleTaken = await prisma.user.findUnique({
    where: { handle: normalisedHandle },
  });
  if (handleTaken) throw new AuthError("Username already taken", 409);

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      handle: normalisedHandle,
      email: normalisedEmail,
      phone: normalisedPhone,
      passwordHash,
      privacy: { create: {} },
      chatPrefs: { create: {} },
    },
    select: PUBLIC_USER_SELECT,
  });

  return issueTokens(user);
}

export async function loginUser({ identifier, password }) {
  const trimmed = identifier.trim();
  // Resolve identifier in this order: email → phone → handle.
  // The login form lets users type any of the three.
  let user = null;
  if (trimmed.includes("@")) {
    user = await prisma.user.findUnique({
      where: { email: trimmed.toLowerCase() },
    });
  } else if (/^[\d+()\s-]+$/.test(trimmed)) {
    user = await prisma.user.findUnique({ where: { phone: trimmed } });
  } else {
    user = await prisma.user.findUnique({
      where: { handle: trimmed.toLowerCase() },
    });
  }
  if (!user) throw new AuthError("Invalid credentials", 401);

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new AuthError("Invalid credentials", 401);

  await prisma.user.update({
    where: { id: user.id },
    data: { isOnline: true, lastSeen: new Date() },
  });

  // Strip passwordHash before returning.
  const publicUser = Object.fromEntries(
    Object.keys(PUBLIC_USER_SELECT).map((k) => [k, user[k]]),
  );
  return issueTokens(publicUser);
}

export async function refreshSession(refreshToken) {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload?.sub) throw new AuthError("Invalid refresh token", 401);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: PUBLIC_USER_SELECT,
  });
  if (!user) throw new AuthError("User not found", 401);

  return issueTokens(user);
}

export async function logoutUser(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { isOnline: false, lastSeen: new Date() },
  });
}

export async function getMe(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_SELECT,
  });
}

// Public profile lookup keyed by @handle. Includes the caller's
// relationship label so the page can render the right primary action
// (Add friend / Pending / Accept / Message).
export async function getPublicProfile({ viewerId, handle }) {
  if (!handle) return null;
  const profile = await prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
    select: PUBLIC_USER_SELECT,
  });
  if (!profile) return null;

  // Derive presence from lastSeen recency — see lib/presence.js for
  // why the raw DB `isOnline` column can't be trusted. Same helper is
  // used in chat detail + chat list so every surface agrees.
  const wasMarkedOnline = profile.isOnline;
  applyDerivedPresence(profile);
  if (wasMarkedOnline && !profile.isOnline) {
    // Lazy cleanup so abandoned sessions don't keep reporting online
    // state to anyone else. Fire and forget — a failed write is fine.
    prisma.user
      .update({ where: { id: profile.id }, data: { isOnline: false } })
      .catch(() => {});
  }

  const relationship = viewerId
    ? await relationshipWith(viewerId, profile.id)
    : "NONE";

  // Viewer-only extras: whether the viewer has blocked this user, and a
  // count of chats they share. Skipped for unauthenticated visitors so
  // the public landing isn't a personalised endpoint. Both queries run
  // in parallel and only when the viewer is logged in and not viewing
  // themselves.
  let isBlocked = false;
  let mutualChatCount = 0;
  if (viewerId && viewerId !== profile.id) {
    const [block, sharedChats] = await Promise.all([
      prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: viewerId,
            blockedId: profile.id,
          },
        },
        select: { id: true },
      }),
      // A chat both users are members of (groups + 1:1). The 1:1 chat
      // between them counts as 1 — that matches WhatsApp's "1 chat
      // together" badge on first-time conversations.
      prisma.chat.count({
        where: {
          AND: [
            { members: { some: { userId: viewerId } } },
            { members: { some: { userId: profile.id } } },
          ],
        },
      }),
    ]);
    isBlocked = !!block;
    mutualChatCount = sharedChats;
  }

  return { ...profile, relationship, isBlocked, mutualChatCount };
}

// Search users by name / email / phone. Always excludes the current user and
// anyone the current user has blocked. Returns at most 20 hits.
export async function searchUsers({ userId, query }) {
  const q = query?.trim();
  if (!q) return [];

  const blocked = await prisma.block.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });
  const blockedIds = blocked.map((b) => b.blockedId);

  // Strip a leading "@" so users can search like "@alice".
  const cleaned = q.replace(/^@/, "");

  const users = await prisma.user.findMany({
    where: {
      id: { not: userId, notIn: blockedIds },
      OR: [
        { handle: { contains: cleaned, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    },
    select: PUBLIC_USER_SELECT,
    take: 20,
  });

  // Annotate each row with the friend-request relationship so the search UI
  // can render the right action button (Add / Pending / Accept / Friends).
  return Promise.all(
    users.map(async (u) => ({
      ...u,
      relationship: await relationshipWith(userId, u.id),
    })),
  );
}

async function issueTokens(user) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user.id),
    signRefreshToken(user.id),
  ]);
  return { user, accessToken, refreshToken };
}
