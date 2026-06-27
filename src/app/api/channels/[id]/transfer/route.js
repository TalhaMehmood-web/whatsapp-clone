import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { transferChannelOwnership } from "@/lib/channels";

// POST { targetUserId } — owner-only. After the transfer, the previous
// owner is demoted to admin (if the cap allows) and the target becomes
// the new owner.
export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    await transferChannelOwnership({
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
