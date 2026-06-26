import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteChatForUser } from "@/lib/chats";

// Returns a single chat including members (with peer presence) so the header
// can render name, avatar, and "online" / last seen.
export async function GET(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const chat = await prisma.chat.findFirst({
    where: { id, members: { some: { userId: user.id } } },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              about: true,
              isOnline: true,
              lastSeen: true,
            },
          },
        },
      },
      pins: {
        orderBy: { pinnedAt: "desc" },
        select: { messageId: true },
      },
    },
  });

  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const peers = chat.members
    .filter((m) => m.userId !== user.id)
    .map((m) => m.user);
  const me = chat.members.find((m) => m.userId === user.id);

  return NextResponse.json({
    chat: {
      id: chat.id,
      isGroup: chat.isGroup,
      name: chat.name,
      photo: chat.photo,
      description: chat.description,
      communityId: chat.communityId,
      disappearingSeconds: chat.disappearingSeconds,
      pinnedMessageIds: chat.pins.map((p) => p.messageId),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    },
    peers,
    // The current user's membership flags so the chat header can render
    // the right favourite / locked / muted state without round-tripping
    // through the chat-list cache.
    membership: me && {
      isPinned: me.isPinned,
      isFavourite: me.isFavourite,
      isArchived: me.isArchived,
      isLocked: me.isLocked,
      mutedUntil: me.mutedUntil,
      role: me.role,
    },
  });
}

// "Delete chat" from the chat-list row dropdown — removes this user's
// membership. For groups that's equivalent to leaving; for 1:1 it hides the
// row for me. If nobody is left in the chat we also drop the chat itself.
export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await deleteChatForUser(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
