import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMe } from "@/lib/users";
import { updateMe } from "@/lib/me-profile";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fresh = await getMe(user.id);
  return NextResponse.json(fresh);
}

export async function PATCH(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const updated = await updateMe({ userId: user.id, ...body });
  return NextResponse.json(updated);
}
