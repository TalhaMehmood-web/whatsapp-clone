import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

// GR2: set or rotate the group's shareable invite handle. Patches the
// chat detail cache so the info-sheet copy-link row updates without
// a refetch.
export const useSetGroupInviteHandleMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (handle) =>
      api
        .patch(endpoints.chats.inviteHandle(chatId), { handle })
        .then((r) => r.data),
    onSuccess: ({ inviteHandle }) => {
      qc.setQueryData(queryKeys.chats.detail(chatId), (old) =>
        old ? { ...old, chat: { ...old.chat, inviteHandle } } : old,
      );
    },
  });
};

// GR2: revoke the invite link entirely. Existing members stay; only
// the shared URL stops working.
export const useClearGroupInviteHandleMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.delete(endpoints.chats.inviteHandle(chatId)).then((r) => r.data),
    onSuccess: () => {
      qc.setQueryData(queryKeys.chats.detail(chatId), (old) =>
        old ? { ...old, chat: { ...old.chat, inviteHandle: null } } : old,
      );
    },
  });
};

// GR2: join a group from the /g/{handle} landing CTA. Idempotent on
// the server, so re-clicking just returns the existing chatId.
export const useJoinGroupByInviteHandleMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (handle) =>
      api.post(endpoints.groups.join, { handle }).then((r) => r.data),
    onSuccess: () => {
      // Fresh chat list so the new group shows up immediately. Use
      // `chats.all` to invalidate every list variant (filtered or not).
      qc.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
};

// Idempotent per (user, chat). No cache patch — like the channel /
// community report flows, the only feedback is the success toast.
export const useReportGroupMutation = (chatId) => {
  return useMutation({
    mutationFn: (reason) =>
      api.post(endpoints.chats.report(chatId), { reason }).then((r) => r.data),
  });
};

// Admin-only group meta patch. Server returns the updated chat row;
// we cache-patch the existing useChatQuery(chatId) entry so the
// info-sheet sees the new value without a refetch.
export const useUpdateGroupMetaMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) =>
      api.patch(endpoints.chats.detail(chatId), patch).then((r) => r.data),
    onSuccess: ({ chat }) => {
      qc.setQueryData(queryKeys.chats.detail(chatId), (old) =>
        old ? { ...old, chat: { ...old.chat, ...chat } } : old,
      );
    },
  });
};

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
