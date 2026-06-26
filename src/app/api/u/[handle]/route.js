import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPublicProfile } from "@/lib/users";

export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { handle } = await ctx.params;
  const profile = await getPublicProfile({ viewerId: user.id, handle });
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
