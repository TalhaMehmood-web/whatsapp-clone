import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markChatUnread } from "@/lib/chats";

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const membership = await markChatUnread(user.id, id);
    return NextResponse.json(membership);
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
