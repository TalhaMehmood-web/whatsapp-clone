import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { reportMessage } from "@/lib/messages";

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    await reportMessage({
      userId: user.id,
      messageId: id,
      reason: body?.reason,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
