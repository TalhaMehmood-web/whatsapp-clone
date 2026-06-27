import { prisma } from "./prisma.js";
import { triggerToUser } from "./realtime/server.js";
import { MemberRole } from "@/models/enums";
import {
  COMMUNITY_MAX_MEMBERS,
  COMMUNITY_MAX_SUB_GROUPS,
  COPY,
  SOCKET_EVENT,
} from "@/config/constants";

// Shared validator for the URL slug. Same rules as User.handle so the
// `/c/{handle}` route is symmetrical with `/u/{handle}`.
const HANDLE_RX = /^[a-z0-9_.]{3,30}$/;
function assertValidHandle(handle) {
  if (!HANDLE_RX.test(handle)) {
    const err = new Error(
      "Handle must be 3–30 chars: lowercase letters, numbers, dot or underscore.",
    );
    err.status = 400;
    throw err;
  }
}

// All communities the user belongs to. Includes sub-group previews so
// the chat list pane can render a single inline cluster per community.
export async function listMyCommunities(userId) {
  const memberships = await prisma.communityMember.findMany({
    where: { userId },
    include: {
      community: {
        include: {
          chats: {
            include: {
              messages: { orderBy: { createdAt: "desc" }, take: 1 },
            },
            orderBy: { updatedAt: "desc" },
          },
          _count: { select: { members: true, chats: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    community: {
      id: m.community.id,
      handle: m.community.handle,
      name: m.community.name,
      photo: m.community.photo,
      description: m.community.description,
      createdAt: m.community.createdAt,
      memberCount: m.community._count.members,
      subGroupCount: m.community._count.chats,
    },
    role: m.role,
    chats: m.community.chats.map((c) => ({
      id: c.id,
      name: c.name,
      photo: c.photo,
      lastMessage: c.messages[0] ?? null,
    })),
  }));
}

export async function getCommunity({ userId, communityId }) {
  await assertMembership(userId, communityId);
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      chats: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true, handle: true },
          },
        },
      },
    },
  });
  if (!community) {
    const err = new Error("Community not found");
    err.status = 404;
    throw err;
  }
  return community;
}

// Public lookup by handle for the invite-link landing route. Returns a
// minimal shape that's safe to show an unauthenticated visitor before
// they decide to join.
export async function getCommunityByHandle(handle) {
  const community = await prisma.community.findUnique({
    where: { handle: handle.toLowerCase() },
    include: { _count: { select: { members: true, chats: true } } },
  });
  if (!community) return null;
  return {
    id: community.id,
    handle: community.handle,
    name: community.name,
    photo: community.photo,
    description: community.description,
    memberCount: community._count.members,
    subGroupCount: community._count.chats,
  };
}

// Creates the community, makes the caller OWNER, and auto-creates an
// "Announcements" chat as the first sub-group. The convention mirrors
// WhatsApp: the announcement group sits at the top of the community
// list and is the place owners broadcast to.
export async function createCommunity({ userId, name, handle, photo, description }) {
  if (!name?.trim()) {
    const err = new Error("Community name is required");
    err.status = 400;
    throw err;
  }
  const cleanHandle = handle?.trim().toLowerCase() || null;
  if (cleanHandle) assertValidHandle(cleanHandle);

  // Reject duplicate handle proactively so we get a clean 409 instead
  // of a P2002 from the unique constraint trip.
  if (cleanHandle) {
    const existing = await prisma.community.findUnique({
      where: { handle: cleanHandle },
      select: { id: true },
    });
    if (existing) {
      const err = new Error("That handle is taken.");
      err.status = 409;
      throw err;
    }
  }

  return prisma.$transaction(async (tx) => {
    const community = await tx.community.create({
      data: {
        name: name.trim(),
        handle: cleanHandle,
        photo: photo ?? null,
        description: description ?? null,
        members: { create: { userId, role: MemberRole.OWNER } },
      },
    });

    // Auto-create the announcements chat as the first sub-group. We
    // tag isGroup + communityId + isAnnouncement so the chat list pins
    // it at the top of the community and the message-create path knows
    // to gate posting to community owners/admins only (CO4).
    await tx.chat.create({
      data: {
        isGroup: true,
        name: COPY.COMMUNITIES_ANNOUNCEMENTS,
        communityId: community.id,
        isAnnouncement: true,
        members: {
          create: { userId, role: MemberRole.OWNER },
        },
      },
    });

    return community;
  });
}

// Owner-only metadata edits. Handle uniqueness re-checked on change.
export async function updateCommunity({ actorId, communityId, patch }) {
  await assertCanManage(actorId, communityId);
  const data = {};
  if (typeof patch.name === "string") data.name = patch.name.trim();
  if (typeof patch.description === "string") data.description = patch.description;
  if (patch.photo !== undefined) data.photo = patch.photo;
  if (patch.handle !== undefined) {
    const clean = patch.handle?.trim().toLowerCase() || null;
    if (clean) assertValidHandle(clean);
    if (clean) {
      const owner = await prisma.community.findUnique({
        where: { handle: clean },
        select: { id: true },
      });
      if (owner && owner.id !== communityId) {
        const err = new Error("That handle is taken.");
        err.status = 409;
        throw err;
      }
    }
    data.handle = clean;
  }
  return prisma.community.update({ where: { id: communityId }, data });
}

// Owner-only. Cascade drops sub-group chats via the schema relation.
// We fire a community:removed event to every member so their lists
// drop the row immediately.
export async function deleteCommunity({ actorId, communityId }) {
  await assertOwner(actorId, communityId);
  const members = await prisma.communityMember.findMany({
    where: { communityId },
    select: { userId: true },
  });
  await prisma.community.delete({ where: { id: communityId } });
  await Promise.all(
    members.map((m) =>
      triggerToUser(m.userId, SOCKET_EVENT.COMMUNITY_REMOVED, {
        communityId,
      }),
    ),
  );
}

// Admin-or-owner. Enforces the 50-member cap before the insert.
export async function addMembers({ actorId, communityId, userIds }) {
  await assertCanManage(actorId, communityId);
  const peers = Array.from(new Set((userIds ?? []).filter(Boolean)));
  if (peers.length === 0) return [];

  const currentCount = await prisma.communityMember.count({
    where: { communityId },
  });
  if (currentCount + peers.length > COMMUNITY_MAX_MEMBERS) {
    const err = new Error(
      COPY.COMMUNITIES_CAP_MEMBERS(COMMUNITY_MAX_MEMBERS),
    );
    err.status = 413;
    throw err;
  }

  // Skip users that are already members.
  const existing = await prisma.communityMember.findMany({
    where: { communityId, userId: { in: peers } },
    select: { userId: true },
  });
  const existingSet = new Set(existing.map((e) => e.userId));
  const fresh = peers.filter((id) => !existingSet.has(id));
  if (fresh.length === 0) return [];

  await prisma.communityMember.createMany({
    data: fresh.map((userId) => ({
      communityId,
      userId,
      role: MemberRole.MEMBER,
    })),
  });

  // Push a single community:added event to each new member so their
  // lists pick up the row in real time.
  await Promise.all(
    fresh.map((userId) =>
      triggerToUser(userId, SOCKET_EVENT.COMMUNITY_ADDED, {
        communityId,
      }),
    ),
  );

  return fresh;
}

// Admin-or-owner removes a member. Owner can't be removed; transfer
// ownership first via updateMemberRole.
export async function removeMember({ actorId, communityId, targetUserId }) {
  await assertCanManage(actorId, communityId);
  const target = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: targetUserId } },
  });
  if (!target) return;
  if (target.role === MemberRole.OWNER) {
    const err = new Error("The owner can't be removed.");
    err.status = 400;
    throw err;
  }
  await prisma.communityMember.delete({
    where: { communityId_userId: { communityId, userId: targetUserId } },
  });
  await triggerToUser(targetUserId, SOCKET_EVENT.COMMUNITY_REMOVED, {
    communityId,
  });
}

// Owner-only role change. Promote / demote, plus owner transfer.
export async function updateMemberRole({
  actorId,
  communityId,
  targetUserId,
  role,
}) {
  await assertOwner(actorId, communityId);
  if (
    role !== MemberRole.OWNER &&
    role !== MemberRole.ADMIN &&
    role !== MemberRole.MEMBER
  ) {
    const err = new Error("Invalid role");
    err.status = 400;
    throw err;
  }
  // Owner transfer is two writes in a tx so we never end up with two
  // owners or none.
  if (role === MemberRole.OWNER) {
    await prisma.$transaction([
      prisma.communityMember.update({
        where: { communityId_userId: { communityId, userId: actorId } },
        data: { role: MemberRole.ADMIN },
      }),
      prisma.communityMember.update({
        where: { communityId_userId: { communityId, userId: targetUserId } },
        data: { role: MemberRole.OWNER },
      }),
    ]);
    return;
  }
  await prisma.communityMember.update({
    where: { communityId_userId: { communityId, userId: targetUserId } },
    data: { role },
  });
}

// Self-leave. Owner has to transfer ownership first (or delete the
// community) — matches WhatsApp's behaviour.
export async function leaveCommunity({ userId, communityId }) {
  const m = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  if (!m) return;
  if (m.role === MemberRole.OWNER) {
    const err = new Error(
      "Transfer ownership before leaving, or delete the community.",
    );
    err.status = 400;
    throw err;
  }
  await prisma.communityMember.delete({
    where: { communityId_userId: { communityId, userId } },
  });
}

// Public join-via-link entrypoint. Idempotent — re-joining is a noop.
// Enforces the 50-member cap.
export async function joinCommunityByHandle({ userId, handle }) {
  const community = await prisma.community.findUnique({
    where: { handle: handle.toLowerCase() },
    select: { id: true, _count: { select: { members: true } } },
  });
  if (!community) {
    const err = new Error("Community not found");
    err.status = 404;
    throw err;
  }
  const existing = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
  });
  if (existing) return { communityId: community.id, alreadyMember: true };

  if (community._count.members >= COMMUNITY_MAX_MEMBERS) {
    const err = new Error(
      COPY.COMMUNITIES_CAP_MEMBERS(COMMUNITY_MAX_MEMBERS),
    );
    err.status = 413;
    throw err;
  }

  await prisma.communityMember.create({
    data: { communityId: community.id, userId, role: MemberRole.MEMBER },
  });
  return { communityId: community.id, alreadyMember: false };
}

// ─── Reports (CO2) ─────────────────────────────────────────────────
// Idempotent abuse report. Owners can't report their own community
// (silently 400 instead of letting the row exist as noise). The reason
// is optional free-text capped at 280 chars; we don't moderate yet —
// the row simply lands for a future review dashboard. Same shape as
// reportChannel deliberately.
export async function reportCommunity({ userId, communityId, reason }) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true },
  });
  if (!community) {
    const err = new Error("Community not found");
    err.status = 404;
    throw err;
  }
  // An owner reporting their own community makes no sense; block it.
  const me = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
    select: { role: true },
  });
  if (me?.role === MemberRole.OWNER) {
    const err = new Error("You can't report a community you own.");
    err.status = 400;
    throw err;
  }
  const clean = typeof reason === "string" ? reason.slice(0, 280) : null;
  await prisma.communityReport.upsert({
    where: { communityId_userId: { communityId, userId } },
    update: { reason: clean },
    create: { communityId, userId, reason: clean },
  });
}

// ─── Sub-group linking ─────────────────────────────────────────────
// Attaches an existing group chat (created via the regular new-group
// flow) to a community. Enforces the 10-sub-group cap.
export async function addSubGroup({ actorId, communityId, chatId }) {
  await assertCanManage(actorId, communityId);
  const groupCount = await prisma.chat.count({ where: { communityId } });
  if (groupCount >= COMMUNITY_MAX_SUB_GROUPS) {
    const err = new Error(
      COPY.COMMUNITIES_CAP_GROUPS(COMMUNITY_MAX_SUB_GROUPS),
    );
    err.status = 413;
    throw err;
  }
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, isGroup: true, communityId: true },
  });
  if (!chat || !chat.isGroup) {
    const err = new Error("Only group chats can be added to a community.");
    err.status = 400;
    throw err;
  }
  if (chat.communityId && chat.communityId !== communityId) {
    const err = new Error("That chat already belongs to another community.");
    err.status = 409;
    throw err;
  }
  return prisma.chat.update({
    where: { id: chatId },
    data: { communityId },
  });
}

export async function removeSubGroup({ actorId, communityId, chatId }) {
  await assertCanManage(actorId, communityId);
  await prisma.chat.updateMany({
    where: { id: chatId, communityId },
    data: { communityId: null },
  });
}

// ─── Membership / role guards ──────────────────────────────────────

async function assertMembership(userId, communityId) {
  const m = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  if (!m) {
    const err = new Error("Not a member of this community");
    err.status = 403;
    throw err;
  }
}

async function assertCanManage(userId, communityId) {
  const m = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
    select: { role: true },
  });
  if (
    !m ||
    (m.role !== MemberRole.OWNER && m.role !== MemberRole.ADMIN)
  ) {
    const err = new Error("Only admins can do that.");
    err.status = 403;
    throw err;
  }
}

async function assertOwner(userId, communityId) {
  const m = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
    select: { role: true },
  });
  if (!m || m.role !== MemberRole.OWNER) {
    const err = new Error("Only the owner can do that.");
    err.status = 403;
    throw err;
  }
}
