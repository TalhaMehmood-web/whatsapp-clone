import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { joinGroupByInviteHandle } from "@/lib/group-invites";

// Auth-required join via invite link. Idempotent: re-joining returns
// { chatId, alreadyMember: true } so the client can just navigate in.
export async function POST(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const result = await joinGroupByInviteHandle({
      userId: user.id,
      handle: body?.handle,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
