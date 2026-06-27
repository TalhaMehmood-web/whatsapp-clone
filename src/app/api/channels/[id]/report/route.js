import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { reportChannel } from "@/lib/channels";

// POST { reason?: string } — idempotent per (user, channel). Owners
// can't report their own channel. No moderation pipeline yet; the row
// just lands in `ChannelReport` for a future dashboard.
export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    await reportChannel({
      userId: user.id,
      channelId: id,
      reason: body?.reason,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
