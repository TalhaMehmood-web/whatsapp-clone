import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { removeSubGroup } from "@/lib/communities";

// Detach a sub-group from a community. The chat itself stays alive —
// it just stops appearing under the community cluster. Admin-only.
export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, chatId } = await ctx.params;
  try {
    await removeSubGroup({
      actorId: user.id,
      communityId: id,
      chatId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
