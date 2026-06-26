import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setPinned } from "@/lib/chats";

export async function POST(_req, ctx) {
  const user = await requireAuth(_req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await setPinned(user.id, id, true);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, ctx) {
  const user = await requireAuth(_req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await setPinned(user.id, id, false);
  return NextResponse.json({ ok: true });
}
