import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listFriends } from "@/lib/friend-requests";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listFriends(user.id));
}
