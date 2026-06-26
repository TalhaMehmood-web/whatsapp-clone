import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listStarred } from "@/lib/messages";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await listStarred(user.id);
  return NextResponse.json(data);
}
