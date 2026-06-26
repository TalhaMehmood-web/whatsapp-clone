import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

export const useCreateLabelMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.labels.list, payload).then((r) => r.data),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: queryKeys.labels.list });
      const prev = qc.getQueryData(queryKeys.labels.list);
      qc.setQueryData(queryKeys.labels.list, (old) => [
        ...(old ?? []),
        {
          id: `temp-${Date.now()}`,
          userId: "self",
          name: payload.name,
          color: payload.color ?? "#25D366",
          createdAt: new Date().toISOString(),
          __optimistic: true,
        },
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.labels.list, ctx.prev),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.labels.list }),
  });
};

export const useDeleteLabelMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labelId) =>
      api.delete(`${endpoints.labels.list}/${labelId}`).then((r) => r.data),
    onMutate: async (labelId) => {
      await qc.cancelQueries({ queryKey: queryKeys.labels.list });
      const prev = qc.getQueryData(queryKeys.labels.list);
      qc.setQueryData(queryKeys.labels.list, (old) =>
        (old ?? []).filter((l) => l.id !== labelId),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(queryKeys.labels.list, ctx.prev),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.labels.list }),
  });
};

// Toggle a label on a chat. The optimistic update patches the chats.list
// cache (we don't ship label data in the list response yet — that lands when
// the chat-list-item starts rendering label chips below).
export const useAssignLabelMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ labelId, value }) =>
      value
        ? api
            .post(endpoints.chats.labels(chatId), { labelId })
            .then((r) => r.data)
        : api
            .delete(endpoints.chats.labels(chatId), { params: { labelId } })
            .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.chats.all }),
  });
};
