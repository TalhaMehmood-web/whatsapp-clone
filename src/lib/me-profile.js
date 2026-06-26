import { prisma } from "./prisma.js";

const PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar: true,
  about: true,
  lastSeen: true,
  isOnline: true,
  createdAt: true,
};

export async function updateMe({ userId, name, about, avatar }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(about !== undefined ? { about } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    },
    select: PUBLIC_SELECT,
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
  return prisma.privacySettings.upsert({
    where: { userId },
    update: patch,
    create: { userId, ...patch },
  });
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
