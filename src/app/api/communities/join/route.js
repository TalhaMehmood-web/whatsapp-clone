import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { joinCommunityByHandle } from "@/lib/communities";

// Body: { handle: string }. Idempotent — re-joining returns the same
// id with `alreadyMember: true`. Caller is expected to follow up with
// a router.push to /communities/{id} either way.
export async function POST(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body?.handle !== "string") {
    return NextResponse.json({ error: "handle is required" }, { status: 400 });
  }
  try {
    const result = await joinCommunityByHandle({
      userId: user.id,
      handle: body.handle,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
