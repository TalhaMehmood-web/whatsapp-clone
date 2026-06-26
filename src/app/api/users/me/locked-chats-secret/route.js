import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  hasLockedChatsSecret,
  setLockedChatsSecret,
  verifyLockedChatsSecret,
} from "@/lib/locked-chats";

// GET — does the user already have a secret set?
export async function GET(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hasSecret = await hasLockedChatsSecret(user.id);
  return NextResponse.json({ hasSecret });
}

// POST — establish the secret for the first time.
export async function POST(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    await setLockedChatsSecret({ userId: user.id, secret: body?.secret });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

// PUT — verify the supplied secret. We don't issue a session token; the
// client tracks the unlocked state in memory so a refresh re-locks.
export async function PUT(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ok = await verifyLockedChatsSecret({
    userId: user.id,
    secret: body?.secret,
  });
  return NextResponse.json({ ok });
}
