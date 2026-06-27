import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setChannelPrivacy } from "@/lib/channels";

// POST { isPrivate: boolean } — owner-only. Flipping a channel between
// public/private has visibility consequences (private channels are
// hidden from explore + by-handle anonymous lookups would still work
// since the link is the invite vector); we keep it owner-only so
// admins can't downgrade visibility behind the owner's back.
export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const updated = await setChannelPrivacy({
      actorId: user.id,
      channelId: id,
      isPrivate: !!body?.isPrivate,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
