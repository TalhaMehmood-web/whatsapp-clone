import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

export const useCreateChannelMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.channels.list, payload).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.channels.list }),
  });
};

export const useSubscribeChannelMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, value }) =>
      value
        ? api.post(endpoints.channels.detail(channelId)).then((r) => r.data)
        : api.delete(endpoints.channels.detail(channelId)).then((r) => r.data),
    onSuccess: (_data, { channelId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.channels.list });
      qc.invalidateQueries({
        queryKey: queryKeys.channels.detail(channelId),
      });
    },
  });
};
