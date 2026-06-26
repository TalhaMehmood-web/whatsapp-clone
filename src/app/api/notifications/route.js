import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  listNotifications,
  markAllNotificationsRead,
  unreadNotificationCount,
} from "@/lib/notifications";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [items, unread] = await Promise.all([
    listNotifications(user.id),
    unreadNotificationCount(user.id),
  ]);
  return NextResponse.json({ items, unread });
}

// Marks every notification read for the current user.
export async function POST(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
