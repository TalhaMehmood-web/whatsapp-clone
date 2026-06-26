import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

export const useCreateGroupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api
        .post(endpoints.chats.list, { isGroup: true, ...payload })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.chats.all }),
  });
};

export const useAddMembersMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds) =>
      api
        .post(endpoints.chats.members(chatId), { userIds })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.chats.members(chatId) });
      qc.invalidateQueries({ queryKey: queryKeys.chats.detail(chatId) });
    },
  });
};

export const useRemoveMemberMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) =>
      api
        .delete(endpoints.chats.members(chatId), {
          params: { userId },
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.chats.members(chatId) });
      qc.invalidateQueries({ queryKey: queryKeys.chats.detail(chatId) });
    },
  });
};

export const useUpdateMemberRoleMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }) =>
      api
        .patch(endpoints.chats.members(chatId), { userId, role })
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.chats.members(chatId) }),
  });
};

export const useLeaveGroupMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.delete(endpoints.chats.members(chatId)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.chats.all }),
  });
};
