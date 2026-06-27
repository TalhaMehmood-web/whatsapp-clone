import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { reportChat } from "@/lib/chat-reports";

// Idempotent per (user, chat). Repeat reports update the reason field
// in place. Reason is optional free-text up to 280 chars (enforced
// server-side). 1:1 chats are rejected — block the contact instead.
export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    await reportChat({ userId: user.id, chatId: id, reason: body?.reason });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
