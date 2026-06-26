import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { assignLabel, unassignLabel } from "@/lib/labels";

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body?.labelId) {
    return NextResponse.json({ error: "labelId is required" }, { status: 400 });
  }
  try {
    await assignLabel({ userId: user.id, chatId: id, labelId: body.labelId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const labelId = searchParams.get("labelId");
  if (!labelId) {
    return NextResponse.json({ error: "labelId is required" }, { status: 400 });
  }
  await unassignLabel({ userId: user.id, chatId: id, labelId });
  return NextResponse.json({ ok: true });
}
