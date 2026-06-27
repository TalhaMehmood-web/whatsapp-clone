import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { addMembers, getCommunity } from "@/lib/communities";

// GET → members the caller is allowed to see (membership required).
// POST → admin-only batch add. Body: { userIds: string[] }.
export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const community = await getCommunity({
      userId: user.id,
      communityId: id,
    });
    return NextResponse.json({ members: community.members });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const added = await addMembers({
      actorId: user.id,
      communityId: id,
      userIds: body?.userIds ?? [],
    });
    return NextResponse.json({ added });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
