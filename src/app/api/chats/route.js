import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getChats, startDirectChat } from "@/lib/chats";
import { createGroup } from "@/lib/groups";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "all";
  const search = searchParams.get("search") ?? undefined;

  const data = await getChats({ userId: user.id, tab, search });
  return NextResponse.json(data);
}

export async function POST(req) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    if (body.isGroup) {
      const chat = await createGroup({
        ownerId: user.id,
        name: body.name,
        photo: body.photo,
        description: body.description,
        memberIds: body.memberIds,
      });
      return NextResponse.json(chat, { status: 201 });
    }

    if (!body.peerUserId) {
      return NextResponse.json(
        { error: "peerUserId is required for 1:1 chats" },
        { status: 400 },
      );
    }

    const chat = await startDirectChat({
      userId: user.id,
      peerUserId: body.peerUserId,
    });
    return NextResponse.json(chat, { status: 201 });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
