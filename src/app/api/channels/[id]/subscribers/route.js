import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listChannelSubscribers } from "@/lib/channels";

// GET — subscribers list with privacy gating. Owners + admins see
// every subscriber; everyone else sees only the caller's accepted-
// friend overlap. The `gated` boolean tells the UI whether to show
// the "You can only view followers who are your friends or admins"
// hint at the bottom of the list.
export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const data = await listChannelSubscribers({
      userId: user.id,
      channelId: id,
    });
    return NextResponse.json(data);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
