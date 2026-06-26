import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { globalSearch } from "@/lib/search";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const data = await globalSearch({
    userId: user.id,
    query: searchParams.get("q") ?? "",
  });
  return NextResponse.json(data);
}
