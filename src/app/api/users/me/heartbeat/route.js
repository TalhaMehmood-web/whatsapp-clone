import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Per-session presence ping. The client posts this every ~60 seconds
// while the tab is visible. We stamp lastSeen + isOnline = true; a
// public-profile read derives "online" from how recently lastSeen was
// touched, so a closed tab decays to offline without needing a logout.
//
// Cheap single-row UPDATE — no audit log, no transaction.
export async function POST(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.update({
    where: { id: user.id },
    data: { isOnline: true, lastSeen: new Date() },
  });
  return NextResponse.json({ ok: true });
}
