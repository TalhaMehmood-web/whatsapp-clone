import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  addMembers,
  leaveGroup,
  listMembers,
  removeMember,
  updateMemberRole,
} from "@/lib/groups";

export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const members = await listMembers({ chatId: id, userId: user.id });
    return NextResponse.json(members);
  } catch (err) {
    return handle(err);
  }
}

export async function POST(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.userIds)) {
    return NextResponse.json(
      { error: "userIds is required" },
      { status: 400 },
    );
  }
  try {
    const members = await addMembers({
      chatId: id,
      actorId: user.id,
      userIds: body.userIds,
    });
    return NextResponse.json(members, { status: 201 });
  } catch (err) {
    return handle(err);
  }
}

export async function PATCH(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.role) {
    return NextResponse.json(
      { error: "userId and role are required" },
      { status: 400 },
    );
  }
  try {
    const updated = await updateMemberRole({
      chatId: id,
      actorId: user.id,
      targetUserId: body.userId,
      role: body.role,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handle(err);
  }
}

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId");

  try {
    if (!targetUserId || targetUserId === user.id) {
      await leaveGroup({ chatId: id, userId: user.id });
    } else {
      await removeMember({
        chatId: id,
        actorId: user.id,
        targetUserId,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handle(err);
  }
}

function handle(err) {
  if (err?.status) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  throw err;
}
