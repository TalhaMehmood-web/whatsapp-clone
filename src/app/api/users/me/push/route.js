import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { clearPushSubscription, savePushSubscription } from "@/lib/push";

export async function PUT(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.subscription) {
    return NextResponse.json({ error: "subscription is required" }, { status: 400 });
  }
  await savePushSubscription({
    userId: user.id,
    subscription: body.subscription,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearPushSubscription({ userId: user.id });
  return NextResponse.json({ ok: true });
}
