import { NextResponse } from "next/server";
import { getCommunityByHandle } from "@/lib/communities";

// Public — no auth required. Powers the /c/[handle] invite-link
// landing page. Returns only the minimal shape needed to show
// "Join this community" CTA. Membership state is resolved client-side
// once the user authenticates.
export async function GET(req, ctx) {
  const { handle } = await ctx.params;
  const community = await getCommunityByHandle(handle);
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }
  return NextResponse.json(community);
}
