import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { subscribeChannel, unsubscribeChannel } from "@/lib/channels";

// POST → subscribe (idempotent, 413 over the 500-cap).
// DELETE → unsubscribe (idempotent).
//
// Split out from the parent /api/channels/[id] route so PATCH/DELETE on
// that one can mean "edit/delete the channel itself" instead of
// "(un)subscribe me". The split matches the resource model — the
// subscription is a separate resource than the channel.
export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await subscribeChannel({ userId: user.id, channelId: id });
    return NextResponse.json({ ok: true });
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
    await unsubscribeChannel({ userId: user.id, channelId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
