import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createChannelPost,
  listChannelPosts,
} from "@/lib/channels";

// GET ?cursor=&limit= — paginated feed. Subscribers + owner only.
// POST — owner-only. Server enforces the per-author 1/min rate limit
// inside `createChannelPost`. Body shape mirrors createMessage so the
// existing upload mutation can be reused with a thin wrapper.
export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  try {
    const data = await listChannelPosts({
      userId: user.id,
      channelId: id,
      cursor: searchParams.get("cursor"),
      limit: Number(searchParams.get("limit")) || 20,
    });
    return NextResponse.json(data);
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
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const post = await createChannelPost({
      authorId: user.id,
      channelId: id,
      ...body,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
