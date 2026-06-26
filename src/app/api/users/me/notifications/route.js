import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getNotifPrefs, updateNotifPrefs } from "@/lib/me-profile";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getNotifPrefs(user.id));
}

export async function PATCH(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(
    await updateNotifPrefs({ userId: user.id, ...body }),
  );
}
