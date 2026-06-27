import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

// Starts (or returns the existing) 1:1 chat with another user.
export const useStartChatMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (peerUserId) =>
      api.post(endpoints.chats.list, { peerUserId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.chats.all }),
  });
};

// Patch every cached chat list so a membership flag flip is reflected
// instantly across tabs. Returns a snapshot we can restore in onError.
//
// Handles both shapes the API returns:
//   - the main list endpoint returns Array<Entry>
//   - the /archived endpoint returns { chats: Array<Entry>, count: number }
function patchAllChatLists(qc, chatId, patch) {
  const snapshots = [];
  const patchEntries = (entries) =>
    entries.map((entry) =>
      entry?.chat?.id === chatId
        ? { ...entry, membership: { ...entry.membership, ...patch } }
        : entry,
    );

  qc.getQueriesData({ queryKey: queryKeys.chats.all }).forEach(
    ([key, data]) => {
      if (Array.isArray(data)) {
        snapshots.push([key, data]);
        qc.setQueryData(key, patchEntries(data));
        return;
      }
      if (data && Array.isArray(data.chats)) {
        snapshots.push([key, data]);
        // For isArchived flips we also need to move the row in/out of this
        // list and shift the count so the pill updates instantly.
        const present = data.chats.some((e) => e?.chat?.id === chatId);
        const archiving = patch.isArchived === true;
        const unarchiving = patch.isArchived === false;
        let nextChats = patchEntries(data.chats);
        let delta = 0;
        if (unarchiving && present) {
          nextChats = data.chats.filter((e) => e?.chat?.id !== chatId);
          delta = -1;
        } else if (archiving && !present) {
          // The list refetches on settle; we just bump the count for now.
          delta = 1;
        }
        qc.setQueryData(key, {
          ...data,
          chats: nextChats,
          count: Math.max(0, (data.count ?? 0) + delta),
        });
      }
    },
  );
  return snapshots;
}

function restore(qc, snapshots) {
  snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
}

// Generic factory: same pattern, different endpoint + patch.
//
// No invalidate-on-settle. The optimistic patch already represents the
// post-write state (e.g. isPinned flipped) in every cached list — that's
// the canonical truth. Invalidating after success would refire all chat
// list queries on every pin/favourite/archive toggle, which is the
// thrash we're trying to kill.
function useToggleMutation({ endpoint, getPatch }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, value, body }) =>
      api
        .request({
          method: value ? "post" : "delete",
          url: endpoint(chatId),
          data: body,
        })
        .then((r) => r.data),
    onMutate: async ({ chatId, value }) => {
      await qc.cancelQueries({ queryKey: queryKeys.chats.all });
      return { snapshots: patchAllChatLists(qc, chatId, getPatch(value)) };
    },
    onError: (_e, _v, ctx) => ctx && restore(qc, ctx.snapshots),
  });
}

export const usePinChatMutation = () =>
  useToggleMutation({
    endpoint: endpoints.chats.pin,
    getPatch: (value) => ({ isPinned: value }),
  });

export const useFavouriteChatMutation = () =>
  useToggleMutation({
    endpoint: endpoints.chats.favourite,
    getPatch: (value) => ({ isFavourite: value }),
  });

export const useArchiveChatMutation = () =>
  useToggleMutation({
    endpoint: endpoints.chats.archive,
    getPatch: (value) => ({ isArchived: value }),
  });

// Marks every undelivered/unread message in the chat as READ for the current
// user. Optimistically zeroes the unread badge in every cached chat list.
//
// No invalidate-on-settle: the optimistic patch already sets the unread
// count to 0 in every cached list, and that IS the canonical post-read
// state. Invalidating would refire the three chat-list queries
// (chats?tab=all, archived, locked) on every chat visit — exactly the
// thrash we're trying to eliminate.
export const useMarkChatReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId) =>
      api.post(endpoints.chats.read(chatId)).then((r) => r.data),
    onMutate: async (chatId) => {
      await qc.cancelQueries({ queryKey: queryKeys.chats.all });
      return { snapshots: patchAllChatLists(qc, chatId, { unreadCount: 0 }) };
    },
    onError: (_e, _v, ctx) => ctx && restore(qc, ctx.snapshots),
  });
};

// "Mark as unread" from the chat row dropdown — bumps the unread count so
// the green pill comes back. Optimistic; if the request fails we restore.
export const useMarkChatUnreadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId) =>
      api.post(endpoints.chats.unread(chatId)).then((r) => r.data),
    onMutate: async (chatId) => {
      await qc.cancelQueries({ queryKey: queryKeys.chats.all });
      return {
        snapshots: patchAllChatLists(qc, chatId, { unreadCount: 1 }),
      };
    },
    onError: (_e, _v, ctx) => ctx && restore(qc, ctx.snapshots),
    // Optimistic patch IS the canonical state; no invalidate.
  });
};

// "Clear chat" — wipes message history server-side. Optimistic locally
// (we clear the cached messages list immediately).
export const useClearChatMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId) =>
      api.post(endpoints.chats.clear(chatId)).then((r) => r.data),
    onMutate: async (chatId) => {
      await qc.cancelQueries({
        queryKey: queryKeys.messages.list(chatId),
      });
      const prev = qc.getQueryData(queryKeys.messages.list(chatId));
      qc.setQueryData(queryKeys.messages.list(chatId), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({ ...p, messages: [] })),
        };
      });
      return { prev };
    },
    onError: (_e, chatId, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.messages.list(chatId), ctx.prev);
      }
    },
    // No invalidate-on-settled. The optimistic empty-pages state matches
    // the server result; an invalidate would just refetch the same empty
    // result and tear up the IndexedDB-persisted cache for no reason.
  });
};

// "Delete chat" — drops my membership. Optimistically removes the row from
// every cached chat list (incl. the archived list) so the UI updates
// immediately; rollback on error.
export const useDeleteChatMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId) =>
      api.delete(endpoints.chats.detail(chatId)).then((r) => r.data),
    onMutate: async (chatId) => {
      await qc.cancelQueries({ queryKey: queryKeys.chats.all });
      const snapshots = [];
      qc.getQueriesData({ queryKey: queryKeys.chats.all }).forEach(
        ([key, data]) => {
          if (Array.isArray(data)) {
            snapshots.push([key, data]);
            qc.setQueryData(
              key,
              data.filter((e) => e.chat.id !== chatId),
            );
          } else if (data && Array.isArray(data.chats)) {
            snapshots.push([key, data]);
            const present = data.chats.some((e) => e.chat.id === chatId);
            qc.setQueryData(key, {
              ...data,
              chats: data.chats.filter((e) => e.chat.id !== chatId),
              count: Math.max(0, (data.count ?? 0) - (present ? 1 : 0)),
            });
          }
        },
      );
      qc.removeQueries({ queryKey: queryKeys.messages.list(chatId) });
      qc.removeQueries({ queryKey: queryKeys.chats.detail(chatId) });
      return { snapshots };
    },
    onError: (_e, _v, ctx) => ctx && restore(qc, ctx.snapshots),
    // Clear-chat optimistically removed every row + dropped the per-chat
    // caches; nothing else for the server to teach us.
  });
};

// Mute takes a `durationMs` body — null in the patch means "muted forever",
// but the optimistic shape is just "non-null mutedUntil".
// Lock/unlock a single chat. Requires the user's global secret to be
// known to the server (verified server-side); the client passes it in
// the body.
export const useLockChatMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, value, secret }) =>
      api
        .request({
          method: value ? "post" : "delete",
          url: endpoints.chats.lock(chatId),
          data: { secret },
        })
        .then((r) => r.data),
    onMutate: async ({ chatId, value }) => {
      await qc.cancelQueries({ queryKey: queryKeys.chats.all });
      return {
        snapshots: patchAllChatLists(qc, chatId, { isLocked: value }),
      };
    },
    onError: (_e, _v, ctx) => ctx && restore(qc, ctx.snapshots),
    // Optimistic isLocked flip is canonical; no invalidate.
  });
};

// First-time secret setup. After success the cached "hasSecret" flag
// flips so the lock button stops prompting for setup.
export const useSetLockedChatsSecretMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (secret) =>
      api
        .post(endpoints.users.lockedChatsSecret, { secret })
        .then((r) => r.data),
    onSuccess: () => {
      qc.setQueryData(["auth", "lockedChatsSecret"], { hasSecret: true });
    },
  });
};

// Verify the secret. Used by the unlock dialog before /locked is loaded,
// and again by the lock/unlock mutations on the per-chat toggle.
export const useVerifyLockedChatsSecretMutation = () =>
  useMutation({
    mutationFn: (secret) =>
      api
        .put(endpoints.users.lockedChatsSecret, { secret })
        .then((r) => r.data),
  });

// Disappearing-messages TTL. `seconds = null` turns it off.
export const useSetDisappearingMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seconds) =>
      api
        .put(endpoints.chats.disappearing(chatId), { seconds })
        .then((r) => r.data),
    onMutate: async (seconds) => {
      const key = queryKeys.chats.detail(chatId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) =>
        old?.chat
          ? {
              ...old,
              chat: { ...old.chat, disappearingSeconds: seconds ?? null },
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.chats.detail(chatId), ctx.prev),
    // Optimistic disappearingSeconds patch is canonical; no invalidate.
  });
};

export const useMuteChatMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, value, durationMs }) =>
      api
        .request({
          method: value ? "post" : "delete",
          url: endpoints.chats.mute(chatId),
          data: value ? { durationMs } : undefined,
        })
        .then((r) => r.data),
    onMutate: async ({ chatId, value, durationMs }) => {
      await qc.cancelQueries({ queryKey: queryKeys.chats.all });
      const mutedUntil = value
        ? new Date(
            Date.now() + (durationMs ?? 1000 * 60 * 60 * 24 * 365 * 50),
          ).toISOString()
        : null;
      return {
        snapshots: patchAllChatLists(qc, chatId, { mutedUntil }),
      };
    },
    onError: (_e, _v, ctx) => ctx && restore(qc, ctx.snapshots),
    // Optimistic mutedUntil patch is canonical; no invalidate.
  });
};
