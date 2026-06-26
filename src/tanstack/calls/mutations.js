import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

// Lazy "join via call link" — creates the call on the spot if no one
// has joined yet, otherwise returns the in-progress one. Does NOT ring
// anyone; the link was the invitation.
export const useJoinCallLinkMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.calls.join, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.calls.log }),
  });
};

export const useStartCallMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.calls.list, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.calls.log }),
  });
};

export const useUpdateCallMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ callId, status }) =>
      api.patch(endpoints.calls.detail(callId), { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.calls.log }),
  });
};

export const useEndCallMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (callId) =>
      api.delete(endpoints.calls.detail(callId)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.calls.log }),
  });
};
