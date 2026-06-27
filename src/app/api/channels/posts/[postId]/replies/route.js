import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createChannelPostReply,
  listChannelPostReplies,
} from "@/lib/channels";

// Threaded replies inside a single channel post (C8). Subscribers can
// read + write. Cap of 100 replies/post enforced server-side.
export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await ctx.params;
  try {
    const replies = await listChannelPostReplies({
      userId: user.id,
      postId,
    });
    return NextResponse.json({ replies });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const reply = await createChannelPostReply({
      authorId: user.id,
      postId,
      content: body?.content,
    });
    return NextResponse.json(reply, { status: 201 });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
