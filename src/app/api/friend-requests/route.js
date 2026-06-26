import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  listIncomingRequests,
  listOutgoingRequests,
  sendFriendRequest,
} from "@/lib/friend-requests";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction") ?? "incoming";
  const data =
    direction === "outgoing"
      ? await listOutgoingRequests(user.id)
      : await listIncomingRequests(user.id);
  return NextResponse.json(data);
}

export async function POST(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.toId) {
    return NextResponse.json({ error: "toId is required" }, { status: 400 });
  }
  try {
    const created = await sendFriendRequest({
      fromId: user.id,
      toId: body.toId,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
