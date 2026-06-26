import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markNotificationRead } from "@/lib/notifications";

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await markNotificationRead({ userId: user.id, id });
  return NextResponse.json({ ok: true });
}
