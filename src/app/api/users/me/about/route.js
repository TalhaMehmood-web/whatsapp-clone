import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateMe } from "@/lib/me-profile";

export async function PATCH(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const updated = await updateMe({ userId: user.id, about: body.about ?? "" });
  return NextResponse.json(updated);
}
