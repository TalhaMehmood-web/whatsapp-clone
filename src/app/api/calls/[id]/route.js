import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { endCall, updateCall } from "@/lib/calls";
import { prisma } from "@/lib/prisma";

export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const call = await prisma.call.findFirst({
    where: { id, participants: { some: { userId: user.id } } },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
  });
  if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...call,
    participants: call.participants.map((p) => p.user),
  });
}

export async function PATCH(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const call = await updateCall({
      callId: id,
      userId: user.id,
      status: body.status,
    });
    return NextResponse.json(call);
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const call = await endCall({ callId: id, userId: user.id });
  return NextResponse.json(call);
}
