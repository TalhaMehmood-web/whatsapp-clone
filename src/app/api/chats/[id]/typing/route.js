import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerToChat } from "@/lib/realtime/server";
import { SOCKET_EVENT } from "@/config/constants";

// Typing-indicator broadcaster. The client posts `{ typing: bool }` from
// `use-typing-indicator` after every keystroke; we verify membership,
// then trigger TYPING_UPDATE on the chat's realtime channel.
//
// Why an API route at all: Pusher (and most managed realtime services)
// don't accept client-emitted events without an extra auth path. Routing
// through an API means the membership / block / lock checks still apply.
//
// ── Rate-limit (in-memory, per warm invocation) ───────────────────────
// The client emits typing on every keystroke — without throttling that's
// 5+ Pusher events per second per typing user. Pusher's free tier is
// billed per event, so typing dominates the message count. The
// indicator UX is "show 'typing…' for 1.5s after the last keystroke",
// so we only need ONE `typing: true` event every ~2s to keep it
// visible; anything denser is wasted.
//
// Rules:
//   - `typing: false` always passes through (closes the indicator
//     immediately when the user stops typing or sends).
//   - `typing: true` is dropped if we sent one in the last 2s for the
//     same (chatId, userId).
//
// Why in-memory + serverless caveat: a warm Vercel function instance
// reuses module-level state across requests, so rapid keystrokes routed
// to the same instance get suppressed correctly. Across concurrent
// invocations or cold starts the throttle resets, so worst-case we leak
// 2 events per 100ms — still ~10x better than the unthrottled baseline.
// We don't need a globally-perfect throttle; we just need typing to
// stop being the #1 line item in our Pusher bill.

const TYPING_THROTTLE_MS = 2000;
const lastTypingAt = new Map(); // key: `${chatId}:${userId}` → ms timestamp

// Periodically prune entries older than the throttle window so the map
// doesn't grow unbounded under heavy use. Cheap — runs once per request.
function pruneStale(now) {
  if (lastTypingAt.size < 256) return; // only bother when the map grows
  for (const [key, ts] of lastTypingAt) {
    if (now - ts > TYPING_THROTTLE_MS) lastTypingAt.delete(key);
  }
}

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: chatId } = await ctx.params;

  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId: user.id } },
    select: { id: true },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const typing = !!body?.typing;
  const key = `${chatId}:${user.id}`;
  const now = Date.now();
  pruneStale(now);

  if (typing) {
    const last = lastTypingAt.get(key) ?? 0;
    if (now - last < TYPING_THROTTLE_MS) {
      // Inside the throttle window — drop. Still return 200 so the
      // client's fire-and-forget doesn't log a transient error.
      return NextResponse.json({ ok: true, throttled: true });
    }
    lastTypingAt.set(key, now);
  } else {
    // `typing: false` always fires AND resets the throttle so the next
    // `typing: true` after a pause goes through immediately.
    lastTypingAt.delete(key);
  }

  await triggerToChat(chatId, SOCKET_EVENT.TYPING_UPDATE, {
    chatId,
    userId: user.id,
    typing,
  });
  return NextResponse.json({ ok: true });
}
