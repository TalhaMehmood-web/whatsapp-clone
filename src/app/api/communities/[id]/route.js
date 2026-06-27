import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  deleteCommunity,
  getCommunity,
  updateCommunity,
} from "@/lib/communities";

export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const community = await getCommunity({ userId: user.id, communityId: id });
    return NextResponse.json(community);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function PATCH(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const patch = await req.json().catch(() => ({}));
  try {
    const updated = await updateCommunity({
      actorId: user.id,
      communityId: id,
      patch,
    });
    return NextResponse.json(updated);
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
  const { id } = await ctx.params;
  try {
    await deleteCommunity({ actorId: user.id, communityId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
