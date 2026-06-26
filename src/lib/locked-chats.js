import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

// Tiny dedicated lib for the per-user "secret code" that gates locked
// chats. Mirror of WhatsApp's behavior: every user has one secret code
// (shared across all their locked chats). Once set, unlocking any locked
// chat re-prompts for the same code.

const SALT_ROUNDS = 10;

export async function hasLockedChatsSecret(userId) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedChatsSecret: true },
  });
  return !!u?.lockedChatsSecret;
}

export async function setLockedChatsSecret({ userId, secret }) {
  if (!secret || secret.length < 4) {
    const err = new Error("Secret must be at least 4 characters");
    err.status = 400;
    throw err;
  }
  const hash = await bcrypt.hash(secret, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { lockedChatsSecret: hash },
  });
}

// Verify the supplied code matches the stored hash. Returns true/false;
// callers handle the response shape themselves.
export async function verifyLockedChatsSecret({ userId, secret }) {
  if (!secret) return false;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedChatsSecret: true },
  });
  if (!u?.lockedChatsSecret) return false;
  return bcrypt.compare(secret, u.lockedChatsSecret);
}

// Count of currently-locked chats for the user. Used by the entry row at
// the top of the chat list — "Locked chats (N)".
export async function countLockedChats(userId) {
  return prisma.chatMember.count({
    where: { userId, isLocked: true },
  });
}
