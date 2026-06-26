import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setLocked } from "@/lib/chats";
import {
  hasLockedChatsSecret,
  verifyLockedChatsSecret,
} from "@/lib/locked-chats";

// POST locks the chat. Requires the user to already have a secret set;
// the request body must carry that secret so we can verify the current
// session knows it (defence in depth against XSS — verifying just on the
// client wouldn't prove the user re-supplied the code).
export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  if (!(await hasLockedChatsSecret(user.id))) {
    return NextResponse.json(
      { error: "Set a secret code first" },
      { status: 400 },
    );
  }
  const ok = await verifyLockedChatsSecret({
    userId: user.id,
    secret: body?.secret,
  });
  if (!ok) {
    return NextResponse.json({ error: "Wrong code" }, { status: 403 });
  }
  await setLocked(user.id, id, true);
  return NextResponse.json({ ok: true });
}

// DELETE unlocks the chat. Same secret requirement.
export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const ok = await verifyLockedChatsSecret({
    userId: user.id,
    secret: body?.secret,
  });
  if (!ok) {
    return NextResponse.json({ error: "Wrong code" }, { status: 403 });
  }
  await setLocked(user.id, id, false);
  return NextResponse.json({ ok: true });
}
