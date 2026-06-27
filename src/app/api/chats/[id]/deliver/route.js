import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markChatDelivered } from "@/lib/receipts";

// Called by the recipient's client when it sees MESSAGE_NEW arrive over
// the realtime channel for a chat it isn't currently focusing. Flips
// every still-SENT receipt in this chat to DELIVERED and broadcasts
// MESSAGE_DELIVERED so the sender's bubble gets the double-grey tick.
export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const result = await markChatDelivered({ chatId: id, userId: user.id });
  return NextResponse.json({ ok: true, ...result });
}
