import { NextResponse } from "next/server";
import { AuthError, loginUser } from "@/lib/users";
import { setRefreshCookie } from "@/lib/cookies";
import { validateLogin } from "@/utils/validators";

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const error = validateLogin(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const { user, accessToken, refreshToken } = await loginUser(body);
    const res = NextResponse.json({ user, accessToken });
    return setRefreshCookie(res, refreshToken);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
