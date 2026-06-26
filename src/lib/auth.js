import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

// Access token TTL is intentionally long so daily-use sessions don't expire
// in the middle of the day. The refresh token is still rotated on every
// /api/auth/refresh hit, so we don't lose the silent-renewal guarantee.
const ACCESS_TTL = "24h";
const REFRESH_TTL = "30d";

const accessSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-jwt-secret");
const refreshSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET ?? "dev-jwt-refresh-secret",
  );

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function signAccessToken(userId) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(accessSecret());
}

export async function signRefreshToken(userId) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(refreshSecret());
}

export async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, accessSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token) {
  try {
    const { payload } = await jwtVerify(token, refreshSecret());
    return payload;
  } catch {
    return null;
  }
}

// Used by Route Handlers — pulls the bearer token off the request and resolves
// to the User record (or null). Route handlers should 401 when this returns null.
export async function requireAuth(req) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const payload = await verifyAccessToken(token);
  if (!payload?.sub) return null;
  return prisma.user.findUnique({ where: { id: payload.sub } });
}

// Used by the Socket.io middleware — same as requireAuth but takes a raw token.
export async function verifyToken(token) {
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload?.sub) return null;
  return prisma.user.findUnique({ where: { id: payload.sub } });
}
