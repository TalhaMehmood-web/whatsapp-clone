import { prisma } from "./prisma.js";

const CHANNEL_SELECT = {
  id: true,
  name: true,
  handle: true,
  photo: true,
  description: true,
  createdAt: true,
};

// Channels I subscribe to come back marked `isSubscribed: true`. The rest of
// the response is suggested channels (the most-recently created public ones).
export async function listChannels(userId) {
  const subs = await prisma.channelSubscriber.findMany({
    where: { userId },
    include: { channel: { select: CHANNEL_SELECT } },
    orderBy: { joinedAt: "desc" },
  });
  const mine = subs.map((s) => ({
    ...s.channel,
    mutedUntil: s.mutedUntil,
    isSubscribed: true,
  }));
  const subscribedIds = mine.map((c) => c.id);

  const suggested = await prisma.channel.findMany({
    where: subscribedIds.length ? { id: { notIn: subscribedIds } } : {},
    orderBy: { createdAt: "desc" },
    take: 20,
    select: CHANNEL_SELECT,
  });

  return {
    subscribed: mine,
    suggested: suggested.map((c) => ({ ...c, isSubscribed: false })),
  };
}

export async function getChannel({ userId, channelId }) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: CHANNEL_SELECT,
  });
  if (!channel) {
    const err = new Error("Channel not found");
    err.status = 404;
    throw err;
  }
  const sub = await prisma.channelSubscriber.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });
  return { ...channel, isSubscribed: !!sub, mutedUntil: sub?.mutedUntil ?? null };
}

export async function createChannel({ userId, name, handle, photo, description }) {
  if (!name?.trim() || !handle?.trim()) {
    const err = new Error("Channel name and handle are required");
    err.status = 400;
    throw err;
  }
  try {
    return await prisma.channel.create({
      data: {
        name: name.trim(),
        handle: handle.trim().toLowerCase().replace(/^@/, ""),
        photo: photo ?? null,
        description: description ?? null,
        subscribers: { create: { userId } },
      },
      select: CHANNEL_SELECT,
    });
  } catch (err) {
    if (err.code === "P2002") {
      const e = new Error("Handle already taken");
      e.status = 409;
      throw e;
    }
    throw err;
  }
}

export async function subscribeChannel({ userId, channelId }) {
  await prisma.channelSubscriber.upsert({
    where: { channelId_userId: { channelId, userId } },
    update: {},
    create: { channelId, userId },
  });
}

export async function unsubscribeChannel({ userId, channelId }) {
  await prisma.channelSubscriber
    .delete({
      where: { channelId_userId: { channelId, userId } },
    })
    .catch(() => {});
}
