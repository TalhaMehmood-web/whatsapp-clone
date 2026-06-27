import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { exploreChannels } from "@/lib/channels";

// /channels/explore page in one round-trip. Returns:
//   - trending: top 12 by subscriberCount.
//   - search: handle/name matches when ?q= is supplied.
//   - friends: channels the caller's friends subscribe to, sorted by
//     "most friends follow this".
//
// Search is server-side + press-enter (per the C11 audit matrix) — the
// query string flows through the URL so the React Query cache key for
// each search is stable and inspectable in DevTools.
export async function GET(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || null;
  const data = await exploreChannels({ userId: user.id, q });
  return NextResponse.json(data);
}
