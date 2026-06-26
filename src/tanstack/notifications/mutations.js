import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

// Optimistically marks a single notification read inside the cached payload,
// so the badge drops + the row dims before the round-trip lands.
export const useMarkNotificationReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.post(endpoints.notifications.markRead(id)).then((r) => r.data),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.list });
      const prev = qc.getQueryData(queryKeys.notifications.list);
      qc.setQueryData(queryKeys.notifications.list, (old) => {
        if (!old) return old;
        const now = new Date().toISOString();
        const items = old.items.map((n) =>
          n.id === id && !n.readAt ? { ...n, readAt: now } : n,
        );
        const unread = items.filter((n) => !n.readAt).length;
        return { items, unread };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.notifications.list, ctx.prev),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.notifications.list }),
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post(endpoints.notifications.markAllRead).then((r) => r.data),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.list });
      const prev = qc.getQueryData(queryKeys.notifications.list);
      qc.setQueryData(queryKeys.notifications.list, (old) => {
        if (!old) return old;
        const now = new Date().toISOString();
        return {
          items: old.items.map((n) => (n.readAt ? n : { ...n, readAt: now })),
          unread: 0,
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.notifications.list, ctx.prev),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.notifications.list }),
  });
};
