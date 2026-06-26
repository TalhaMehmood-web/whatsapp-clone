import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setArchived } from "@/lib/chats";

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await setArchived(user.id, id, true);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await setArchived(user.id, id, false);
  return NextResponse.json({ ok: true });
}
