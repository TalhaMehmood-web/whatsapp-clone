"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/auth-store";
import { useSocketStore } from "@/stores/socket-store";
import { queryKeys } from "@/config/query-keys";
import { SOCKET_EVENT } from "@/config/constants";

// Per-channel realtime sync. Joined when the user opens a channel
// detail page; left on navigate so we don't accumulate idle Pusher
// subscriptions in a session that browses many channels.
//
// Wired events:
//   CHANNEL_POST_NEW       → prepend to first page of useChannelPostsQuery
//   CHANNEL_POST_DELETED   → filter out across every cached page
//   CHANNEL_POST_REACTION  → replace the post's reactions array
//   CHANNEL_POST_REPLY     → bump _count.replies on the post; append to
//                            the cached replies list if it's loaded.
//                            The server includes a `recipientIds` set
//                            in the payload — we filter on it so users
//                            who aren't part of the thread don't see
//                            phantom replies in their UI.
//
// Mounted by the channel detail page via a single useEffect. The hook
// itself returns nothing; it's a side-effect anchor.
export function useChannelRealtimeSync(channelId) {
  const socket = useSocketStore((s) => s.socket);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !channelId) return undefined;

    // Subscribe this client to the channel's Pusher room. Refcounted
    // inside the bus — multiple opens of the same channel don't
    // double-subscribe.
    socket.joinChannelRoom(channelId);

    // Track which post ids we've already prepended so a duplicate
    // fanout (rare, but the sender's own tabs receive the event too)
    // doesn't double-render.
    const seenPostIds = new Set();

    const postsKey = queryKeys.channels.posts(channelId);

    const onNew = (post) => {
      if (!post?.id) return;
      if (post.channelId !== channelId) return;
      if (seenPostIds.has(post.id)) return;
      seenPostIds.add(post.id);
      if (seenPostIds.size > 200) {
        seenPostIds.delete(seenPostIds.values().next().value);
      }
      qc.setQueryData(postsKey, (old) => {
        if (!old) return old;
        // Defensive: don't double-prepend if the optimistic create
        // already inserted this post (sender's own client).
        const exists = old.pages.some((p) =>
          p.posts?.some((m) => m.id === post.id),
        );
        if (exists) return old;
        const [first, ...rest] = old.pages;
        return {
          ...old,
          pages: [
            { ...first, posts: [post, ...(first?.posts ?? [])] },
            ...rest,
          ],
        };
      });
    };

    const onDeleted = ({ postId, channelId: cid }) => {
      if (!postId || cid !== channelId) return;
      qc.setQueryData(postsKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            posts: p.posts.filter((m) => m.id !== postId),
          })),
        };
      });
      qc.removeQueries({ queryKey: queryKeys.channels.replies(postId) });
    };

    const onReaction = ({ postId, reactions }) => {
      if (!postId) return;
      qc.setQueryData(postsKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId ? { ...p, reactions } : p,
            ),
          })),
        };
      });
    };

    const onReply = ({ postId, reply, recipientIds }) => {
      if (!postId || !reply) return;
      // Bounded fanout enforcement on the client side: the server
      // included `recipientIds` so non-thread-participants ignore the
      // payload. The post author + every prior replier sees the patch.
      const list = Array.isArray(recipientIds) ? recipientIds : [];
      if (list.length > 0 && userId && !list.includes(userId)) return;

      // Bump the reply count on the post card.
      qc.setQueryData(postsKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    _count: {
                      ...(p._count ?? {}),
                      replies: (p._count?.replies ?? 0) + 1,
                    },
                  }
                : p,
            ),
          })),
        };
      });

      // And append to the cached replies list if the thread sheet is
      // open (the query is keyed by postId). If it isn't cached, the
      // next open of the sheet will fetch fresh and include the reply.
      const repliesKey = queryKeys.channels.replies(postId);
      qc.setQueryData(repliesKey, (old) => {
        if (!Array.isArray(old)) return old;
        if (old.some((r) => r.id === reply.id)) return old;
        return [...old, reply];
      });
    };

    socket.on(SOCKET_EVENT.CHANNEL_POST_NEW, onNew);
    socket.on(SOCKET_EVENT.CHANNEL_POST_DELETED, onDeleted);
    socket.on(SOCKET_EVENT.CHANNEL_POST_REACTION, onReaction);
    socket.on(SOCKET_EVENT.CHANNEL_POST_REPLY, onReply);

    return () => {
      socket.off(SOCKET_EVENT.CHANNEL_POST_NEW, onNew);
      socket.off(SOCKET_EVENT.CHANNEL_POST_DELETED, onDeleted);
      socket.off(SOCKET_EVENT.CHANNEL_POST_REACTION, onReaction);
      socket.off(SOCKET_EVENT.CHANNEL_POST_REPLY, onReply);
      socket.leaveChannelRoom(channelId);
    };
  }, [socket, channelId, qc, userId]);
}
