import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { removeMember, updateMemberRole } from "@/lib/communities";

// PATCH — owner changes a member's role (body: { role: "OWNER" | "ADMIN" | "MEMBER" }).
// "OWNER" performs an atomic owner-transfer (caller becomes ADMIN).
// DELETE — admin or owner removes a member (cannot remove the owner).
export async function PATCH(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, userId: targetUserId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    await updateMemberRole({
      actorId: user.id,
      communityId: id,
      targetUserId,
      role: body?.role,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, userId: targetUserId } = await ctx.params;
  try {
    await removeMember({
      actorId: user.id,
      communityId: id,
      targetUserId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
