import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

export const useCreateCommunityMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.communities.list, payload).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.communities.list }),
  });
};
