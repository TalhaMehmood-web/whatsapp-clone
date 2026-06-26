import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { starMessage } from "@/lib/messages";

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await starMessage({ userId: user.id, messageId: id, value: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await starMessage({ userId: user.id, messageId: id, value: false });
  return NextResponse.json({ ok: true });
}
