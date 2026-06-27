import { prisma } from "./prisma.js";
import { MemberRole } from "@/models/enums";

// Shared handle validator. Mirrors User.handle and Community.handle so
// /g/{handle} feels symmetric to /u/{handle} and /c/{handle}.
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

async function assertGroupAdmin(chatId, userId) {
  const m = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: { role: true, chat: { select: { isGroup: true } } },
  });
  if (!m || !m.chat?.isGroup) {
    const err = new Error("Group not found");
    err.status = 404;
    throw err;
  }
  if (m.role !== MemberRole.OWNER && m.role !== MemberRole.ADMIN) {
    const err = new Error("Only group admins can do that.");
    err.status = 403;
    throw err;
  }
}

// Set or change a group's invite handle. Admin-only. Rejects duplicates
// with a clean 409 instead of letting the unique-constraint blow up.
export async function setGroupInviteHandle({ actorId, chatId, handle }) {
  await assertGroupAdmin(chatId, actorId);
  const clean = handle?.trim().toLowerCase();
  assertValidHandle(clean);
  const taken = await prisma.chat.findUnique({
    where: { inviteHandle: clean },
    select: { id: true },
  });
  if (taken && taken.id !== chatId) {
    const err = new Error("That invite link is already in use.");
    err.status = 409;
    throw err;
  }
  return prisma.chat.update({
    where: { id: chatId },
    data: { inviteHandle: clean },
    select: { id: true, inviteHandle: true },
  });
}

// Remove the invite link. Admin-only. After this, the old URL 404s.
// Use this to "revoke" a leaked link; admins can also call
// setGroupInviteHandle with a fresh handle to rotate without breaking
// existing members.
export async function clearGroupInviteHandle({ actorId, chatId }) {
  await assertGroupAdmin(chatId, actorId);
  return prisma.chat.update({
    where: { id: chatId },
    data: { inviteHandle: null },
    select: { id: true, inviteHandle: true },
  });
}

// Public lookup for the /g/{handle} landing page. Returns a minimal
// shape safe to show an unauthenticated visitor before they decide to
// join. Mirrors getCommunityByHandle.
export async function getGroupByInviteHandle(handle) {
  if (!handle) return null;
  const chat = await prisma.chat.findUnique({
    where: { inviteHandle: handle.toLowerCase() },
    select: {
      id: true,
      name: true,
      photo: true,
      description: true,
      inviteHandle: true,
      _count: { select: { members: true } },
    },
  });
  if (!chat) return null;
  return {
    id: chat.id,
    name: chat.name,
    photo: chat.photo,
    description: chat.description,
    inviteHandle: chat.inviteHandle,
    memberCount: chat._count.members,
  };
}

// Idempotent join. Re-joining returns the existing chatId so the client
// just navigates into the group. No size cap on group chats today —
// add one here if/when the free tier needs protection.
export async function joinGroupByInviteHandle({ userId, handle }) {
  if (!handle) {
    const err = new Error("Invite link missing.");
    err.status = 400;
    throw err;
  }
  const chat = await prisma.chat.findUnique({
    where: { inviteHandle: handle.toLowerCase() },
    select: { id: true, isGroup: true },
  });
  if (!chat || !chat.isGroup) {
    const err = new Error("Group not found");
    err.status = 404;
    throw err;
  }
  const existing = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId: chat.id, userId } },
    select: { id: true },
  });
  if (existing) return { chatId: chat.id, alreadyMember: true };
  await prisma.chatMember.create({
    data: { chatId: chat.id, userId, role: MemberRole.MEMBER },
  });
  return { chatId: chat.id, alreadyMember: false };
}
