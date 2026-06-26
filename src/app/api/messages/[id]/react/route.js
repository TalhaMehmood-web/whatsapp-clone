import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { toggleReaction } from "@/lib/reactions";

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body?.emoji) {
    return NextResponse.json({ error: "emoji is required" }, { status: 400 });
  }
  try {
    const result = await toggleReaction({
      userId: user.id,
      messageId: id,
      emoji: body.emoji,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
