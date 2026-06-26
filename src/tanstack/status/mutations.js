import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

export const useCreateStatusMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.status.list, payload).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.status.all }),
  });
};

// Marks a status as seen by the current user. We don't need to refetch
// the feed for this — the ring will turn grey on the next natural fetch.
// We do invalidate the author reel cache so the eye count on the author's
// own viewer updates.
export const useViewStatusMutation = (authorId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (statusId) =>
      api.post(endpoints.status.view(statusId)).then((r) => r.data),
    onSuccess: () => {
      if (authorId) {
        qc.invalidateQueries({ queryKey: queryKeys.status.author(authorId) });
      }
    },
  });
};

export const useDeleteStatusMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (statusId) =>
      api.delete(endpoints.status.detail(statusId)).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.status.all }),
  });
};
