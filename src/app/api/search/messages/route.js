import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchMessages } from "@/lib/messages";

// Global cross-chat message search. Single endpoint; the client passes
// the COMMITTED query (Enter-pressed, not on-change) as `q`.
//
// Caller scope: only chats the user is a member of, honouring per-user
// clearedAt cutoffs and MessageHidden masks. Capped at 50 rows by the
// lib so a long match list never blows Neon compute.
export async function GET(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });
  const data = await searchMessages({ userId: user.id, q });
  return NextResponse.json(data);
}
