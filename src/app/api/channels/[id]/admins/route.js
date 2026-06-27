import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { addChannelAdmin, listChannelAdmins } from "@/lib/channels";

// GET — subscribers + owner + admins can see the admin roster.
// POST { targetUserId } — owner-only, idempotent, 5-admin cap.
export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const data = await listChannelAdmins({ userId: user.id, channelId: id });
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
    await addChannelAdmin({
      actorId: user.id,
      channelId: id,
      targetUserId: body?.targetUserId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
