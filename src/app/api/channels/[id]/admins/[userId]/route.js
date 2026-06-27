import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { removeChannelAdmin } from "@/lib/channels";

// DELETE — owner-only demote. Removing the owner here is a no-op
// because the owner isn't on the ChannelAdmin table to begin with.
export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, userId: targetUserId } = await ctx.params;
  try {
    await removeChannelAdmin({
      actorId: user.id,
      channelId: id,
      targetUserId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
