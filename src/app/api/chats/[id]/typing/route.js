import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerToChat } from "@/lib/realtime/server";
import { SOCKET_EVENT } from "@/config/constants";

// Typing-indicator broadcaster. The client posts `{ typing: bool }` from
// `use-typing-indicator`; we verify membership, then trigger
// TYPING_UPDATE on the chat's realtime channel so every other member
// sees the update.
//
// This route exists because Pusher (and most managed realtime services)
// don't accept client-emitted events without an extra auth path. Routing
// through an API call means the server-side membership / block / lock
// checks still apply. Cheap — no DB write, just one fast-path check + a
// Pusher trigger HTTPS call.
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

  await triggerToChat(chatId, SOCKET_EVENT.TYPING_UPDATE, {
    chatId,
    userId: user.id,
    typing,
  });
  return NextResponse.json({ ok: true });
}
