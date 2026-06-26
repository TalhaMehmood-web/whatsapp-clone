import { prisma } from "./prisma.js";
import { MemberRole } from "@/models/enums";

// All communities the user belongs to, each with its sub-group chats and the
// last message per sub-group so the list pane can show previews.
export async function listMyCommunities(userId) {
  const memberships = await prisma.communityMember.findMany({
    where: { userId },
    include: {
      community: {
        include: {
          chats: {
            include: {
              messages: { orderBy: { createdAt: "desc" }, take: 1 },
            },
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    community: {
      id: m.community.id,
      name: m.community.name,
      photo: m.community.photo,
      description: m.community.description,
      createdAt: m.community.createdAt,
    },
    role: m.role,
    chats: m.community.chats.map((c) => ({
      id: c.id,
      name: c.name,
      photo: c.photo,
      lastMessage: c.messages[0] ?? null,
    })),
  }));
}

export async function getCommunity({ userId, communityId }) {
  await assertMembership(userId, communityId);
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      chats: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });
  if (!community) {
    const err = new Error("Community not found");
    err.status = 404;
    throw err;
  }
  return community;
}

export async function createCommunity({ userId, name, photo, description }) {
  if (!name?.trim()) {
    const err = new Error("Community name is required");
    err.status = 400;
    throw err;
  }
  return prisma.community.create({
    data: {
      name: name.trim(),
      photo: photo ?? null,
      description: description ?? null,
      members: {
        create: { userId, role: MemberRole.OWNER },
      },
    },
  });
}

async function assertMembership(userId, communityId) {
  const m = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  if (!m) {
    const err = new Error("Not a member of this community");
    err.status = 403;
    throw err;
  }
}
