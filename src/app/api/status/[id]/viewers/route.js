import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listViewers } from "@/lib/status";

export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const viewers = await listViewers({ userId: user.id, statusId: id });
    return NextResponse.json(viewers);
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
