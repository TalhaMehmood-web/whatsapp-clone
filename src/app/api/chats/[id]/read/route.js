import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markChatRead } from "@/lib/receipts";

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await markChatRead({ chatId: id, userId: user.id });
  return NextResponse.json({ ok: true });
}
