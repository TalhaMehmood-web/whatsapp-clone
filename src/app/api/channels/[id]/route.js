import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getChannel,
  subscribeChannel,
  unsubscribeChannel,
} from "@/lib/channels";

export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const channel = await getChannel({ userId: user.id, channelId: id });
    return NextResponse.json(channel);
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await subscribeChannel({ userId: user.id, channelId: id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await unsubscribeChannel({ userId: user.id, channelId: id });
  return NextResponse.json({ ok: true });
}
