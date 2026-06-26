import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMe } from "@/lib/users";
import { deleteMe, updateMe } from "@/lib/me-profile";

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

// Permanently deletes the caller's account. The client must confirm by
// re-typing the handle so a slip on the destructive button can't trash
// an account — same guard WhatsApp uses on the phone-number step.
export async function DELETE(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (
    typeof body?.confirmHandle !== "string" ||
    body.confirmHandle.trim().toLowerCase() !== (user.handle ?? "").toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Handle does not match" },
      { status: 400 },
    );
  }
  await deleteMe({ userId: user.id });
  return NextResponse.json({ ok: true });
}
