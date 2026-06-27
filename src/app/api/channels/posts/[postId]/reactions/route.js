import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { toggleChannelPostReaction } from "@/lib/channels";

// POST { emoji: "👍" } — toggle. Adding the same emoji a second time
// removes it. Server emits CHANNEL_POST_REACTION with the full
// canonical reaction list so every client patches in lockstep.
export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const reactions = await toggleChannelPostReaction({
      userId: user.id,
      postId,
      emoji: body?.emoji,
    });
    return NextResponse.json({ reactions });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
