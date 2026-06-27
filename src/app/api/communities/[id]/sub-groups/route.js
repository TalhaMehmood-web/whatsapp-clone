import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { addSubGroup } from "@/lib/communities";

// Body: { chatId: string } — attach an existing group chat to this
// community. The caller is expected to have created the group via the
// regular /api/chats/groups flow first; this route only sets the FK.
//
// Enforces the 10-sub-group cap server-side.
export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (typeof body?.chatId !== "string") {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }
  try {
    const chat = await addSubGroup({
      actorId: user.id,
      communityId: id,
      chatId: body.chatId,
    });
    return NextResponse.json(chat);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
