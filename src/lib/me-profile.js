import { prisma } from "./prisma.js";
import { listFriends } from "./friend-requests.js";

// The five Privacy rows that support a "My contacts except…" picker. We
// gate writes through this list so a typo client-side can't poison the
// JSON column with an unknown key.
const EXCEPTION_FIELDS = new Set([
  "lastSeen",
  "profilePhoto",
  "about",
  "status",
  "groupsPolicy",
]);

const PUBLIC_SELECT = {
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

export async function updateMe({ userId, name, about, avatar, securityNotifications }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(about !== undefined ? { about } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
      ...(securityNotifications !== undefined
        ? { securityNotifications: !!securityNotifications }
        : {}),
    },
    select: PUBLIC_SELECT,
  });
}

// Hard-deletes the user and every owned row. Most relations cascade in
// the schema (chats, statuses, friend requests, …) but a handful of FKs
// (Message.sender, Block.blocker/blocked, CallParticipant.user) are
// non-cascading on purpose so a single failed delete doesn't wipe group
// history. We tombstone those rows manually here so the transaction
// succeeds even when the user authored messages in chats they shared.
//
// We also drop the user's 1:1 chats outright — there's no second member
// who could meaningfully read them once the account is gone. Group chat
// memberships are removed via cascade on ChatMember.
//
// Cloudinary assets owned by the user are intentionally NOT destroyed
// here; the upload folder is keyed by userId and our retention policy
// prunes orphan folders out-of-band. Keeps the request well under the
// route timeout.
export async function deleteMe({ userId }) {
  await prisma.$transaction(async (tx) => {
    // Tombstone every message the user sent so peer chats keep working.
    await tx.message.updateMany({
      where: { senderId: userId },
      data: {
        deletedAt: new Date(),
        content: null,
        mediaUrl: null,
        mediaThumbUrl: null,
        mediaPublicId: null,
        mediaResource: null,
      },
    });
    // Detach call-participant rows so the user.delete cascade doesn't
    // trip the non-cascading CallParticipant.userId FK.
    await tx.callParticipant.deleteMany({ where: { userId } });
    // Drop block rows in either direction — they reference the user by
    // non-cascading FKs.
    await tx.block.deleteMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    });
    // Now the user.delete cascade can walk the rest of the graph safely.
    await tx.user.delete({ where: { id: userId } });
  });
}

export async function getPrivacy(userId) {
  return prisma.privacySettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function updatePrivacy({ userId, ...patch }) {
  // Server-enforced invariant: when Last seen is hidden from anyone,
  // Online presence MUST mirror Last seen. If the caller is shrinking the
  // lastSeen scope below EVERYONE we force onlineMatchesLastSeen back on
  // so the row is coherent even if the UI never visits the Online radio.
  if (patch.lastSeen && patch.lastSeen !== "EVERYONE") {
    patch.onlineMatchesLastSeen = true;
  }
  return prisma.privacySettings.upsert({
    where: { userId },
    update: patch,
    create: { userId, ...patch },
  });
}

// Replace the excluded-user-id list for one Privacy field (e.g. lastSeen).
// We re-read the JSON column first, splice in the new array, and write it
// back so the other fields are preserved. Unknown ids and self-id are
// dropped server-side — the picker can't trick us into excluding strangers.
export async function setPrivacyException({ userId, field, excludedIds }) {
  if (!EXCEPTION_FIELDS.has(field)) {
    const err = new Error(`Unknown privacy field: ${field}`);
    err.status = 400;
    throw err;
  }
  const ids = Array.isArray(excludedIds) ? [...new Set(excludedIds)] : [];
  // Friend-list filter: you can only exclude people who are actually
  // contacts. Anything else is silently dropped.
  const friends = await listFriends(userId);
  const friendIds = new Set(friends.map((f) => f.id));
  const clean = ids.filter((id) => id !== userId && friendIds.has(id));

  const current = await prisma.privacySettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { privacyExceptions: true },
  });
  const exceptions = { ...(current.privacyExceptions ?? {}), [field]: clean };
  return prisma.privacySettings.update({
    where: { userId },
    data: { privacyExceptions: exceptions },
  });
}

// Lightweight contact list for the exception picker: the user's accepted
// friends with only the fields the picker needs. Sorted by name so the
// list is stable between renders.
export async function getEligibleContacts(userId) {
  const friends = await listFriends(userId);
  return friends
    .map((f) => ({
      id: f.id,
      name: f.name,
      avatar: f.avatar ?? null,
      about: f.about ?? null,
    }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}

export async function getChatPrefs(userId) {
  return prisma.chatPreferences.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function updateChatPrefs({ userId, ...patch }) {
  return prisma.chatPreferences.upsert({
    where: { userId },
    update: patch,
    create: { userId, ...patch },
  });
}

// Notification kind toggles (Messages / Groups / Status / reaction sounds).
// Upsert pattern: a brand-new user has no row, so the first GET creates
// defaults — keeps clients from needing a separate "init" step.
export async function getNotifPrefs(userId) {
  return prisma.notificationPreferences.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function updateNotifPrefs({ userId, ...patch }) {
  // Strip any unknown keys defensively — Prisma would reject them anyway
  // but a clean 400 path is more honest than a Prisma stack trace.
  const allowed = ["messages", "groups", "status", "reactionSounds"];
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([k]) => allowed.includes(k)),
  );
  return prisma.notificationPreferences.upsert({
    where: { userId },
    update: clean,
    create: { userId, ...clean },
  });
}
