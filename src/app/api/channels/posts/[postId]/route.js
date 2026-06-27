import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteChannelPost } from "@/lib/channels";

// DELETE single post. Owner-only (gated in the lib). Cascades to
// reactions + replies via FK; Cloudinary asset is destroyed inside
// the lib after the DB delete.
export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await ctx.params;
  try {
    await deleteChannelPost({ actorId: user.id, postId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
