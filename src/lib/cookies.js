import { COOKIE } from "@/config/constants";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function setRefreshCookie(res, token) {
  res.cookies.set(COOKIE.REFRESH_TOKEN, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return res;
}

export function clearRefreshCookie(res) {
  res.cookies.set(COOKIE.REFRESH_TOKEN, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export function readRefreshCookie(req) {
  return req.cookies.get(COOKIE.REFRESH_TOKEN)?.value ?? null;
}
