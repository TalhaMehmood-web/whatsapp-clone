import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
} from "@/lib/friend-requests";

// PATCH body shape: { action: "accept" | "decline" | "cancel" }
export async function PATCH(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const action = body?.action;

  try {
    let updated;
    if (action === "accept") {
      updated = await acceptFriendRequest({ actorId: user.id, requestId: id });
    } else if (action === "decline") {
      updated = await declineFriendRequest({ actorId: user.id, requestId: id });
    } else if (action === "cancel") {
      updated = await cancelFriendRequest({ actorId: user.id, requestId: id });
    } else {
      return NextResponse.json(
        { error: "action must be accept, decline, or cancel" },
        { status: 400 },
      );
    }
    return NextResponse.json(updated);
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
