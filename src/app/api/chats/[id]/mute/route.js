import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setMuted } from "@/lib/chats";

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  // Default: mute "forever" (year 9999) so the UI can show an indefinite icon
  // without juggling nulls.
  const until = body.until
    ? new Date(body.until)
    : body.durationMs
      ? new Date(Date.now() + Number(body.durationMs))
      : new Date("9999-12-31T23:59:59Z");

  await setMuted(user.id, id, until);
  return NextResponse.json({ ok: true, mutedUntil: until.toISOString() });
}

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await setMuted(user.id, id, null);
  return NextResponse.json({ ok: true });
}
