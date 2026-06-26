import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { countArchivedChats, getChats } from "@/lib/chats";
import { CHAT_TAB } from "@/config/constants";

// Combined endpoint: returns the full archived chat list + count in one
// round trip so the "Archived (N)" pill and the /archived page can share a
// single cache key without two separate fetches.
export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [chats, count] = await Promise.all([
    getChats({ userId: user.id, tab: CHAT_TAB.ARCHIVED }),
    countArchivedChats(user.id),
  ]);
  return NextResponse.json({ chats, count });
}
