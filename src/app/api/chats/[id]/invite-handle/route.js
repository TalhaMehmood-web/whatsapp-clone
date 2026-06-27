import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  clearGroupInviteHandle,
  setGroupInviteHandle,
} from "@/lib/group-invites";

// PATCH sets or rotates the group's shareable invite handle. Body:
// { handle: "my-cool-group" }. Admin-only at the lib layer.
export async function PATCH(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const result = await setGroupInviteHandle({
      actorId: user.id,
      chatId: id,
      handle: body?.handle,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

// DELETE revokes the invite link. The URL 404s afterwards. Existing
// members stay; this only stops new joins via the shared link.
export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const result = await clearGroupInviteHandle({
      actorId: user.id,
      chatId: id,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
