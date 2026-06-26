import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { chatSearch } from "@/lib/search";

export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const data = await chatSearch({
    userId: user.id,
    chatId: id,
    query: searchParams.get("q") ?? "",
  });
  return NextResponse.json(data);
}
