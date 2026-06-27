import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

// ─── Channel CRUD ────────────────────────────────────────────────

export const useCreateChannelMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.channels.list, payload).then((r) => r.data),
    onSuccess: (channel) => {
      // Patch the cached list so the new channel appears at the top
      // of "Subscribed". No invalidate — the canonical shape is what
      // the server returned.
      qc.setQueryData(queryKeys.channels.list, (old) =>
        old
          ? {
              ...old,
              subscribed: [
                { ...channel, mutedUntil: null, isSubscribed: true },
                ...(old.subscribed ?? []),
              ],
            }
          : old,
      );
    },
  });
};

export const useUpdateChannelMutation = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) =>
      api.patch(endpoints.channels.detail(id), patch).then((r) => r.data),
    onSuccess: (channel) => {
      qc.setQueryData(queryKeys.channels.detail(id), (old) =>
        old ? { ...old, ...channel } : old,
      );
      qc.setQueryData(queryKeys.channels.list, (old) => {
        if (!old) return old;
        return {
          ...old,
          subscribed: (old.subscribed ?? []).map((c) =>
            c.id === id ? { ...c, ...channel } : c,
          ),
        };
      });
    },
  });
};

export const useDeleteChannelMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.delete(endpoints.channels.detail(id)).then(() => id),
    onSuccess: (id) => {
      qc.setQueryData(queryKeys.channels.list, (old) =>
        old
          ? {
              ...old,
              subscribed: (old.subscribed ?? []).filter((c) => c.id !== id),
              suggested: (old.suggested ?? []).filter((c) => c.id !== id),
            }
          : old,
      );
      qc.removeQueries({ queryKey: queryKeys.channels.detail(id) });
      qc.removeQueries({ queryKey: queryKeys.channels.posts(id) });
    },
  });
};

// ─── Subscribe / mute ────────────────────────────────────────────

// Optimistic: flip the cached `isSubscribed` flag immediately, roll
// back on error. Same shape as the chat-pin / favourite mutations.
export const useSubscribeChannelMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, value }) =>
      value
        ? api.post(endpoints.channels.subscribe(channelId)).then(() => channelId)
        : api
            .delete(endpoints.channels.subscribe(channelId))
            .then(() => channelId),
    onMutate: async ({ channelId, value }) => {
      const detailKey = queryKeys.channels.detail(channelId);
      const listKey = queryKeys.channels.list;
      await Promise.all([
        qc.cancelQueries({ queryKey: detailKey }),
        qc.cancelQueries({ queryKey: listKey }),
      ]);
      const prevDetail = qc.getQueryData(detailKey);
      const prevList = qc.getQueryData(listKey);
      qc.setQueryData(detailKey, (old) =>
        old
          ? {
              ...old,
              isSubscribed: value,
              subscriberCount: Math.max(
                0,
                (old.subscriberCount ?? 0) + (value ? 1 : -1),
              ),
            }
          : old,
      );
      qc.setQueryData(listKey, (old) => {
        if (!old) return old;
        const subscribed = (old.subscribed ?? []).map((c) =>
          c.id === channelId ? { ...c, isSubscribed: value } : c,
        );
        const suggested = (old.suggested ?? []).map((c) =>
          c.id === channelId ? { ...c, isSubscribed: value } : c,
        );
        return { ...old, subscribed, suggested };
      });
      return { prevDetail, prevList };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevDetail) {
        qc.setQueryData(
          queryKeys.channels.detail(_v.channelId),
          ctx.prevDetail,
        );
      }
      if (ctx?.prevList) {
        qc.setQueryData(queryKeys.channels.list, ctx.prevList);
      }
    },
  });
};

export const useMuteChannelMutation = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mutedUntil) =>
      api
        .post(endpoints.channels.mute(id), { mutedUntil })
        .then(() => mutedUntil),
    onSuccess: (mutedUntil) => {
      qc.setQueryData(queryKeys.channels.detail(id), (old) =>
        old ? { ...old, mutedUntil } : old,
      );
    },
  });
};

// ─── Posts ───────────────────────────────────────────────────────

// Owner-only. Patches the infinite-query cache by prepending the new
// post to the first page so the feed updates instantly.
export const useCreateChannelPostMutation = (channelId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api
        .post(endpoints.channels.posts(channelId), payload)
        .then((r) => r.data),
    onSuccess: (post) => {
      const key = queryKeys.channels.posts(channelId);
      qc.setQueryData(key, (old) => {
        if (!old) return old;
        // Skip if the realtime CHANNEL_POST_NEW event already prepended
        // this post — sender's tabs receive their own Pusher fanout, so
        // mutation success + realtime race; whichever lands first wins.
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
    },
  });
};

export const useDeleteChannelPostMutation = (channelId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) =>
      api.delete(endpoints.channels.post(postId)).then(() => postId),
    onSuccess: (postId) => {
      const key = queryKeys.channels.posts(channelId);
      qc.setQueryData(key, (old) => {
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
    },
  });
};

// Toggle emoji reaction. Optimistically patch the post's reactions
// array so the pill updates before the server confirms.
export const useToggleChannelPostReactionMutation = (channelId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, emoji }) =>
      api
        .post(endpoints.channels.postReactions(postId), { emoji })
        .then((r) => r.data.reactions),
    onMutate: async ({ postId, emoji, userId }) => {
      const key = queryKeys.channels.posts(channelId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) => {
              if (p.id !== postId) return p;
              const has = (p.reactions ?? []).some(
                (r) => r.userId === userId && r.emoji === emoji,
              );
              const reactions = has
                ? (p.reactions ?? []).filter(
                    (r) => !(r.userId === userId && r.emoji === emoji),
                  )
                : [...(p.reactions ?? []), { userId, emoji }];
              return { ...p, reactions };
            }),
          })),
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.channels.posts(channelId), ctx.prev),
    onSuccess: (reactions, { postId }) => {
      // Replace with server-canonical array so we're not eventually
      // drifting from the truth (e.g. two tabs reacting concurrently).
      const key = queryKeys.channels.posts(channelId);
      qc.setQueryData(key, (old) => {
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
    },
  });
};

// ─── Threaded replies (C8) ───────────────────────────────────────

export const useCreateChannelPostReplyMutation = (postId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content) =>
      api
        .post(endpoints.channels.postReplies(postId), { content })
        .then((r) => r.data),
    onSuccess: (reply) => {
      qc.setQueryData(queryKeys.channels.replies(postId), (old) => {
        if (!Array.isArray(old)) return [reply];
        // Realtime CHANNEL_POST_REPLY may have appended this already on
        // the sender's tabs (Pusher fans out to the sender too).
        if (old.some((r) => r.id === reply.id)) return old;
        return [...old, reply];
      });
    },
  });
};

// ─── Admins (CH1) ────────────────────────────────────────────────
// Server returns { ok: true } on add — we don't have the full user
// row client-side, so we invalidate the admins query instead of
// guessing. One refetch per add is fine because the list is small
// (≤5 admins) and the action is rare.

export const useAddChannelAdminMutation = (channelId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) =>
      api
        .post(endpoints.channels.admins(channelId), { targetUserId })
        .then(() => targetUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.channels.admins(channelId) });
    },
  });
};

export const useRemoveChannelAdminMutation = (channelId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) =>
      api
        .delete(endpoints.channels.admin(channelId, targetUserId))
        .then(() => targetUserId),
    onSuccess: (targetUserId) => {
      qc.setQueryData(queryKeys.channels.admins(channelId), (old) =>
        old
          ? {
              ...old,
              admins: (old.admins ?? []).filter((u) => u.id !== targetUserId),
            }
          : old,
      );
    },
  });
};

export const useTransferChannelOwnershipMutation = (channelId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) =>
      api
        .post(endpoints.channels.transfer(channelId), { targetUserId })
        .then(() => targetUserId),
    onSuccess: (targetUserId) => {
      // The owner identity changed; flip isOwner on the detail cache so
      // every owner-gated affordance updates immediately. Admins cache
      // gets a hard refresh since the previous owner may have been
      // demoted to admin (depending on the cap).
      qc.setQueryData(queryKeys.channels.detail(channelId), (old) =>
        old
          ? {
              ...old,
              ownerId: targetUserId,
              isOwner: false,
            }
          : old,
      );
      qc.invalidateQueries({ queryKey: queryKeys.channels.admins(channelId) });
    },
  });
};

// ─── Privacy (CH2) ───────────────────────────────────────────────

export const useSetChannelPrivacyMutation = (channelId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isPrivate) =>
      api
        .post(endpoints.channels.privacy(channelId), { isPrivate })
        .then((r) => r.data),
    onSuccess: (channel) => {
      qc.setQueryData(queryKeys.channels.detail(channelId), (old) =>
        old ? { ...old, ...channel } : old,
      );
    },
  });
};

// ─── Report (CH2) ────────────────────────────────────────────────
// Idempotent server-side. No cache patching needed — we don't expose
// "reported state" to the user beyond the toast acknowledgement.

export const useReportChannelMutation = (channelId) => {
  return useMutation({
    mutationFn: (reason) =>
      api
        .post(endpoints.channels.report(channelId), { reason })
        .then((r) => r.data),
  });
};
