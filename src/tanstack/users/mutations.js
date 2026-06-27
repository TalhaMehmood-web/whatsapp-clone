import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export const useUpdateMeMutation = () => {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (payload) =>
      api.patch(endpoints.users.me, payload).then((r) => r.data),
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.auth.me, user);
      setUser(user);
    },
  });
};

export const useUpdateAboutMutation = () => {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (about) =>
      api.patch(endpoints.users.about, { about }).then((r) => r.data),
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.auth.me, user);
      setUser(user);
    },
  });
};

export const useUpdateAvatarMutation = () => {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append("file", file);
      const res = await api.put(endpoints.users.avatar, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.auth.me, user);
      setUser(user);
    },
  });
};

export const useDeleteAvatarMutation = () => {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: () => api.delete(endpoints.users.avatar).then((r) => r.data),
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.auth.me, user);
      setUser(user);
    },
  });
};

// Permanently deletes the caller's account. Server requires the user to
// re-type their @handle as a confirmation guard. On success we tear down
// the whole client-side session — auth store cleared, every cache wiped
// — and the caller is responsible for redirecting to /login.
export const useDeleteAccountMutation = () => {
  const qc = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: (confirmHandle) =>
      api
        .delete(endpoints.users.me, { data: { confirmHandle } })
        .then((r) => r.data),
    onSuccess: () => {
      clearSession();
      qc.clear();
    },
  });
};

// Optimistically patch the privacy cache. The Privacy settings page renders
// directly off this cache, so changes feel instant.
//
// We deliberately do NOT invalidate on settle — the server returns the
// canonical row on success and our onSuccess patch overwrites the cache
// with that exact shape. Invalidating would trigger a redundant GET on
// every toggle, which violates the Settings cache contract.
export const useUpdatePrivacyMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) =>
      api.patch(endpoints.users.privacy, patch).then((r) => r.data),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: queryKeys.users.privacy });
      const prev = qc.getQueryData(queryKeys.users.privacy);
      qc.setQueryData(queryKeys.users.privacy, (old) =>
        old ? { ...old, ...patch } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.users.privacy, ctx.prev),
    onSuccess: (server) =>
      qc.setQueryData(queryKeys.users.privacy, server),
  });
};

// Replaces the excluded-id array for one Privacy field (e.g. lastSeen,
// profilePhoto). Patches the cached privacy row optimistically with the
// new `privacyExceptions` JSON so the row sublabel ("281 contacts
// excluded") updates the moment the picker's Done button is pressed.
export const useUpdatePrivacyExceptionsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ field, excludedIds }) =>
      api
        .patch(endpoints.users.privacyExceptions, { field, excludedIds })
        .then((r) => r.data),
    onMutate: async ({ field, excludedIds }) => {
      await qc.cancelQueries({ queryKey: queryKeys.users.privacy });
      const prev = qc.getQueryData(queryKeys.users.privacy);
      qc.setQueryData(queryKeys.users.privacy, (old) =>
        old
          ? {
              ...old,
              privacyExceptions: {
                ...(old.privacyExceptions ?? {}),
                [field]: excludedIds,
              },
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.users.privacy, ctx.prev),
    onSuccess: (server) =>
      qc.setQueryData(queryKeys.users.privacy, server),
  });
};

// Optimistic toggle for the Notifications screen. Same shape as the
// privacy + chat-prefs mutations — patch first, server overwrites on
// success, no invalidate so the Network tab stays clean.
export const useUpdateNotifPrefsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) =>
      api.patch(endpoints.users.notifPrefs, patch).then((r) => r.data),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: queryKeys.users.notifPrefs });
      const prev = qc.getQueryData(queryKeys.users.notifPrefs);
      qc.setQueryData(queryKeys.users.notifPrefs, (old) =>
        old ? { ...old, ...patch } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.users.notifPrefs, ctx.prev),
    onSuccess: (server) =>
      qc.setQueryData(queryKeys.users.notifPrefs, server),
  });
};

// Uploads a custom wallpaper image and writes the URL onto the chat-prefs
// row in one round-trip. The cache patch happens on success so the
// active chat's <ChatWallpaper> swaps over immediately.
export const useUploadWallpaperMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append("file", file);
      const res = await api.put(endpoints.users.wallpaper, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (server) =>
      qc.setQueryData(queryKeys.users.chatPrefs, server),
  });
};

export const useDeleteWallpaperMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(endpoints.users.wallpaper).then((r) => r.data),
    onSuccess: (server) =>
      qc.setQueryData(queryKeys.users.chatPrefs, server),
  });
};

// Same shape as useUpdatePrivacyMutation: optimistic patch on click,
// server-returned canonical row replaces the cache on success. We never
// invalidate after — the server response already overwrites the cache
// with the authoritative shape, and a redundant GET per toggle would
// blow the Settings cache contract.
export const useUpdateChatPrefsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) =>
      api.patch(endpoints.users.chatPrefs, patch).then((r) => r.data),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: queryKeys.users.chatPrefs });
      const prev = qc.getQueryData(queryKeys.users.chatPrefs);
      qc.setQueryData(queryKeys.users.chatPrefs, (old) =>
        old ? { ...old, ...patch } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.users.chatPrefs, ctx.prev),
    onSuccess: (server) =>
      qc.setQueryData(queryKeys.users.chatPrefs, server),
  });
};

// Server-side persistence of the browser's PushSubscription. The hook in
// `use-push-subscription` calls these once the user grants permission.
export const useSavePushSubscriptionMutation = () =>
  useMutation({
    mutationFn: (subscription) =>
      api
        .put(endpoints.users.push, { subscription })
        .then((r) => r.data),
  });

export const useClearPushSubscriptionMutation = () =>
  useMutation({
    mutationFn: () => api.delete(endpoints.users.push).then((r) => r.data),
  });

// ─── Block / Unblock ───────────────────────────────────────────────────────

// Flip the `isBlocked` flag on a public-profile cache entry, if one
// exists. Block/Unblock mutations call this so the /u/{handle} page
// updates instantly without a refetch.
function patchProfileBlocked(qc, handle, value) {
  if (!handle) return;
  qc.setQueryData(queryKeys.users.byHandle(handle.toLowerCase()), (old) =>
    old ? { ...old, isBlocked: value } : old,
  );
}

export const useBlockUserMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (peer) =>
      api.post(endpoints.users.block(peer.id)).then(() => peer),
    onMutate: async (peer) => {
      await qc.cancelQueries({ queryKey: queryKeys.users.blocked });
      const prev = qc.getQueryData(queryKeys.users.blocked) ?? [];
      qc.setQueryData(queryKeys.users.blocked, [
        peer,
        ...prev.filter((p) => p.id !== peer.id),
      ]);
      patchProfileBlocked(qc, peer.handle, true);
      return { prev, handle: peer.handle };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      qc.setQueryData(queryKeys.users.blocked, ctx.prev);
      patchProfileBlocked(qc, ctx.handle, false);
    },
    // No invalidate-on-settle: the optimistic patch already encodes the
    // canonical state (a known peer object added to the list), and the
    // server response carries no new information to reconcile.
  });
};

export const useUnblockUserMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    // Accept either a string id (legacy callers) or a `peer` object so
    // we can also flip the profile cache when the handle is known.
    mutationFn: (peerOrId) => {
      const id = typeof peerOrId === "string" ? peerOrId : peerOrId.id;
      return api.delete(endpoints.users.block(id)).then(() => peerOrId);
    },
    onMutate: async (peerOrId) => {
      const id = typeof peerOrId === "string" ? peerOrId : peerOrId.id;
      const handle =
        typeof peerOrId === "string" ? null : peerOrId.handle ?? null;
      await qc.cancelQueries({ queryKey: queryKeys.users.blocked });
      const prev = qc.getQueryData(queryKeys.users.blocked) ?? [];
      // If the call came in by id, see if we already know the handle
      // from the blocked-list cache so we can still patch the profile.
      const cachedHandle =
        handle ?? prev.find((p) => p.id === id)?.handle ?? null;
      qc.setQueryData(
        queryKeys.users.blocked,
        prev.filter((p) => p.id !== id),
      );
      patchProfileBlocked(qc, cachedHandle, false);
      return { prev, handle: cachedHandle };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      qc.setQueryData(queryKeys.users.blocked, ctx.prev);
      patchProfileBlocked(qc, ctx.handle, true);
    },
    // Same rationale as useBlockUserMutation — the optimistic filter is
    // canonical, no need to re-fetch the list on success.
  });
};
