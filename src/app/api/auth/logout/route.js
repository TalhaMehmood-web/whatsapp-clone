import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { logoutUser } from "@/lib/users";
import { clearRefreshCookie } from "@/lib/cookies";

export async function POST(req) {
  const user = await requireAuth(req);
  if (user) await logoutUser(user.id);
  const res = NextResponse.json({ ok: true });
  return clearRefreshCookie(res);
}
