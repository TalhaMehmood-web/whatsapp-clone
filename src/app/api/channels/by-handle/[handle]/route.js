import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getChannelByHandle } from "@/lib/channels";

// Auth optional — `/ch/{handle}` invite-landing page calls this. We
// resolve the caller (if authed) so we can stamp `isSubscribed` /
// `isOwner` flags on the response, which lets the landing page show
// the right CTA without a second query.
export async function GET(req, ctx) {
  const user = await requireAuth(req).catch(() => null);
  const { handle } = await ctx.params;
  const channel = await getChannelByHandle({
    userId: user?.id ?? null,
    handle,
  });
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }
  return NextResponse.json(channel);
}
