import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export const useLoginMutation = () => {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.auth.login, payload).then((r) => r.data),
    onSuccess: (data) => {
      setSession(data);
      qc.setQueryData(queryKeys.auth.me, data.user);
    },
  });
};

export const useRegisterMutation = () => {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.auth.register, payload).then((r) => r.data),
    onSuccess: (data) => {
      setSession(data);
      qc.setQueryData(queryKeys.auth.me, data.user);
    },
  });
};

export const useLogoutMutation = () => {
  const qc = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: () => api.post(endpoints.auth.logout).then((r) => r.data),
    // Optimistic: clear local state immediately so the UI flips to the auth
    // screen without waiting for the round-trip. Rollback if the call fails.
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.auth.me });
      const prev = qc.getQueryData(queryKeys.auth.me);
      qc.setQueryData(queryKeys.auth.me, null);
      clearSession();
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.auth.me, ctx.prev);
    },
    onSettled: () => qc.clear(),
  });
};
