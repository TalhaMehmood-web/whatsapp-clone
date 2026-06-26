import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchUsers } from "@/lib/users";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("search") ?? "";
  const results = await searchUsers({ userId: user.id, query });
  return NextResponse.json(results);
}
