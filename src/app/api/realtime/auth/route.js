import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorizeSubscription } from "@/lib/realtime/server";
import {
  chatIdFromChannel,
  isChatChannel,
  isPresenceChannel,
  isUserChannel,
  userIdFromChannel,
} from "@/lib/realtime/channels";

// Realtime subscription authoriser. This is the single security
// boundary for "who can listen to what".
//
// Pusher's client SDK POSTs `socket_id` + `channel_name` here whenever it
// wants to subscribe to a `private-` or `presence-` channel. We:
//   1. Verify the JWT (same path every other API uses).
//   2. Confirm the requested channel is one the user is allowed on:
//      - `private-user-{id}` only when id === self.
//      - `private-chat-{id}` only when self is a ChatMember of that chat.
//      - `presence-online` for any authenticated user.
//   3. Hand the request to the adapter to produce a signed payload.
//
// Any new channel pattern added later MUST gain an explicit allow-rule
// here. Default-deny: anything unmatched returns 403.
export async function POST(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Pusher sends the body as `application/x-www-form-urlencoded`.
  const form = await req.formData();
  const socketId = form.get("socket_id");
  const channel = form.get("channel_name");
  if (typeof socketId !== "string" || typeof channel !== "string") {
    return NextResponse.json(
      { error: "Missing socket_id or channel_name" },
      { status: 400 },
    );
  }

  // ── Allow-list ──────────────────────────────────────────────────────
  if (isUserChannel(channel)) {
    if (userIdFromChannel(channel) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (isChatChannel(channel)) {
    const chatId = chatIdFromChannel(channel);
    const member = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId: user.id } },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (isPresenceChannel(channel)) {
    // Every authenticated user is allowed on presence-online — nothing
    // to check beyond auth.
  } else {
    return NextResponse.json({ error: "Unknown channel" }, { status: 400 });
  }

  // ── Sign the subscription ───────────────────────────────────────────
  // user_info is exposed to other presence subscribers as part of the
  // member object. We only put the minimum that the UI needs to render
  // a presence list — name + avatar — and keep email/phone off the
  // wire to respect privacy.
  const payload = authorizeSubscription({
    socketId,
    channel,
    userId: user.id,
    userInfo: {
      name: user.name ?? "",
      avatar: user.avatar ?? null,
    },
  });

  return NextResponse.json(payload);
}
