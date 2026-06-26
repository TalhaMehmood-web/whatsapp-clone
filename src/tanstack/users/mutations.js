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

// Optimistically patch the privacy cache. The Privacy settings page renders
// directly off this cache, so changes feel instant.
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
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.users.privacy }),
  });
};

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
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.users.chatPrefs }),
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
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.users.blocked, ctx.prev),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.users.blocked }),
  });
};

export const useUnblockUserMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (peerId) =>
      api.delete(endpoints.users.block(peerId)).then(() => peerId),
    onMutate: async (peerId) => {
      await qc.cancelQueries({ queryKey: queryKeys.users.blocked });
      const prev = qc.getQueryData(queryKeys.users.blocked) ?? [];
      qc.setQueryData(
        queryKeys.users.blocked,
        prev.filter((p) => p.id !== peerId),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.users.blocked, ctx.prev),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.users.blocked }),
  });
};
