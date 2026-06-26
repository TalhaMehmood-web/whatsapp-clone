import { NextResponse } from "next/server";
import { AuthError, refreshSession } from "@/lib/users";
import { readRefreshCookie, setRefreshCookie } from "@/lib/cookies";

export async function POST(req) {
  const token = readRefreshCookie(req);
  if (!token) {
    return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
  }

  try {
    const { user, accessToken, refreshToken } = await refreshSession(token);
    const res = NextResponse.json({ user, accessToken });
    return setRefreshCookie(res, refreshToken);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
