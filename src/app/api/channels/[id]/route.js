import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  deleteChannel,
  getChannel,
  updateChannel,
} from "@/lib/channels";

// Subscribe / unsubscribe moved to /api/channels/[id]/subscribe so this
// route can do real CRUD on the channel itself. GET = read (subscribers
// can read, plus the explore surface uses by-handle). PATCH/DELETE are
// owner-only and gated by the lib.
export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const channel = await getChannel({ userId: user.id, channelId: id });
    return NextResponse.json(channel);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function PATCH(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const patch = await req.json().catch(() => ({}));
  try {
    const updated = await updateChannel({
      actorId: user.id,
      channelId: id,
      patch,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await deleteChannel({ actorId: user.id, channelId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
