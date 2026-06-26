import { prisma } from "./prisma.js";
import { emitToUser } from "./socket-server.js";
import { SOCKET_EVENT } from "@/config/constants";

const NOTIFICATIONS_LIMIT = 100;

// Creates a Notification row and pushes it to the recipient over Socket.io
// so the bell badge updates live without a refetch.
export async function createNotification({ userId, kind, title, body, data }) {
  const row = await prisma.notification.create({
    data: {
      userId,
      kind,
      title,
      body: body ?? null,
      data: data ?? null,
    },
  });
  emitToUser(userId, SOCKET_EVENT.NOTIFICATION_NEW, row);
  return row;
}

export function listNotifications(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: NOTIFICATIONS_LIMIT,
  });
}

export function unreadNotificationCount(userId) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markNotificationRead({ userId, id }) {
  // Scope the update to (id, userId) so a stolen id can't flip someone
  // else's row.
  return prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
