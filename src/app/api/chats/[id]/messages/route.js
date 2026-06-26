import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createMessage, getMessages } from "@/lib/messages";
import { PAGE_SIZE } from "@/config/constants";

export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const before = searchParams.get("cursor") ?? undefined;
  const limit = Number(searchParams.get("limit")) || PAGE_SIZE.MESSAGES;
  const data = await getMessages({
    chatId: id,
    userId: user.id,
    before,
    limit,
  });
  return NextResponse.json(data);
}

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    const message = await createMessage({
      chatId: id,
      senderId: user.id,
      ...body,
    });
    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
