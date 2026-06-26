import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteLabel } from "@/lib/labels";

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await deleteLabel({ userId: user.id, labelId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
