import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setChannelMute } from "@/lib/channels";

// POST { mutedUntil: ISOString | null }. Per-subscriber mute window —
// independent of the channel itself, so subscribers can silence a
// noisy author without unsubscribing.
export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    await setChannelMute({
      userId: user.id,
      channelId: id,
      mutedUntil: body?.mutedUntil ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
