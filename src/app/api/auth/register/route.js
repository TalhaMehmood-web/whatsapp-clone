import { NextResponse } from "next/server";
import { AuthError, registerUser } from "@/lib/users";
import { setRefreshCookie } from "@/lib/cookies";
import { validateRegister } from "@/utils/validators";

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const error = validateRegister(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const { user, accessToken, refreshToken } = await registerUser(body);
    const res = NextResponse.json({ user, accessToken }, { status: 201 });
    return setRefreshCookie(res, refreshToken);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
