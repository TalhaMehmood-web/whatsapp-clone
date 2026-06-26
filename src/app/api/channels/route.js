import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createChannel, listChannels } from "@/lib/channels";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await listChannels(user.id);
  return NextResponse.json(data);
}

export async function POST(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  try {
    const channel = await createChannel({ userId: user.id, ...body });
    return NextResponse.json(channel, { status: 201 });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
