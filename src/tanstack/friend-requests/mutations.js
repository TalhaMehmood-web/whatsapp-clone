import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

function invalidateAll(qc) {
  qc.invalidateQueries({ queryKey: queryKeys.friendRequests.incoming });
  qc.invalidateQueries({ queryKey: queryKeys.friendRequests.outgoing });
  qc.invalidateQueries({ queryKey: queryKeys.friendRequests.friends });
  // Search results carry a per-user relationship label — bust those too.
  qc.invalidateQueries({ queryKey: queryKeys.users.all });
}

export const useSendFriendRequestMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toId) =>
      api
        .post(endpoints.friendRequests.send, { toId })
        .then((r) => r.data),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useRespondFriendRequestMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) =>
      api
        .patch(endpoints.friendRequests.item(id), { action })
        .then((r) => r.data),
    onSuccess: () => invalidateAll(qc),
  });
};
