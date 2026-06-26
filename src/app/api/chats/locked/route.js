import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getChats } from "@/lib/chats";
import { countLockedChats } from "@/lib/locked-chats";
import { CHAT_TAB } from "@/config/constants";

// Combined endpoint: returns the locked chat list + count, mirroring
// /api/chats/archived. The count powers the "Locked chats" row that
// surfaces atop the main chat list when any chats are locked.
export async function GET(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [chats, count] = await Promise.all([
    getChats({ userId: user.id, tab: CHAT_TAB.LOCKED }),
    countLockedChats(user.id),
  ]);
  return NextResponse.json({ chats, count });
}
