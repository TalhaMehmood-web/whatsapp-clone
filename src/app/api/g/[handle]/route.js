import { NextResponse } from "next/server";
import { getGroupByInviteHandle } from "@/lib/group-invites";

// Public read for the /g/{handle} invite landing page. Returns 404 if
// the handle doesn't resolve; otherwise the minimal card-shape payload
// (no member list, no messages — those require membership).
export async function GET(_req, ctx) {
  const { handle } = await ctx.params;
  const group = await getGroupByInviteHandle(handle);
  if (!group)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}
