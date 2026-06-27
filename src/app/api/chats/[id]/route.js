import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteChatForUser } from "@/lib/chats";
import { updateGroupMeta } from "@/lib/groups";
import { applyDerivedPresence } from "@/lib/presence";

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

  // Derive `isOnline` from lastSeen recency for every peer — the raw
  // DB column is stuck-on for anyone who closed their tab without
  // logging out. See lib/presence.js.
  const peers = chat.members
    .filter((m) => m.userId !== user.id)
    .map((m) => applyDerivedPresence({ ...m.user }));
  const me = chat.members.find((m) => m.userId === user.id);

  // For announcement chats inside a community, the composer needs to
  // know whether the caller can post (OWNER/ADMIN at the community
  // level). One extra query on a cold path — chat-detail isn't fired
  // per message — keeps the UI gate in sync with the server-side check
  // in createMessage.
  let communityRole = null;
  if (chat.isAnnouncement && chat.communityId) {
    const cm = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: chat.communityId, userId: user.id },
      },
      select: { role: true },
    });
    communityRole = cm?.role ?? null;
  }

  return NextResponse.json({
    chat: {
      id: chat.id,
      isGroup: chat.isGroup,
      name: chat.name,
      photo: chat.photo,
      description: chat.description,
      communityId: chat.communityId,
      isAnnouncement: chat.isAnnouncement,
      inviteHandle: chat.inviteHandle,
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
      // Caller's community-level role for announcement chats. Null when
      // the chat isn't an announcement group or the caller isn't a
      // community member.
      communityRole,
    },
  });
}

// Group-meta patch (GR1). Admin-only at the lib layer — fields that
// can be patched today are name, photo, description, isAnnouncement.
// Used by the group-info sheet's announcement toggle and the future
// edit-group dialog.
export async function PATCH(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const updated = await updateGroupMeta({
      chatId: id,
      actorId: user.id,
      name: body.name,
      photo: body.photo,
      description: body.description,
      isAnnouncement: body.isAnnouncement,
    });
    return NextResponse.json({
      chat: {
        id: updated.id,
        isGroup: updated.isGroup,
        name: updated.name,
        photo: updated.photo,
        description: updated.description,
        isAnnouncement: updated.isAnnouncement,
        inviteHandle: updated.inviteHandle,
        communityId: updated.communityId,
      },
    });
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
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
