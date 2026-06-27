import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";

// Create / update / delete a community. The list query is patched on
// success (cheaper than refetching) and the detail query is patched
// on update to keep the open community page live.
//
// We never `invalidateQueries` after success — the optimistic patch or
// the server return shape IS the canonical state, and refetching here
// would fire a wasted GET on every mutation (same contract as
// Settings; see CLAUDE.md S7 for the rationale).

export const useCreateCommunityMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.communities.list, payload).then((r) => r.data),
    onSuccess: (community) => {
      // Newly created communities go to the top of the list with the
      // caller as OWNER. The lib auto-creates one Announcements
      // sub-group, so we mirror that shape in the cache patch.
      qc.setQueryData(queryKeys.communities.list, (old) => {
        if (!Array.isArray(old)) return old;
        return [
          {
            community: {
              id: community.id,
              handle: community.handle,
              name: community.name,
              photo: community.photo,
              description: community.description,
              createdAt: community.createdAt,
              memberCount: 1,
              subGroupCount: 1,
            },
            role: "OWNER",
            chats: [],
          },
          ...old,
        ];
      });
    },
  });
};

export const useUpdateCommunityMutation = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) =>
      api.patch(endpoints.communities.detail(id), patch).then((r) => r.data),
    onSuccess: (community) => {
      // Patch the detail row.
      qc.setQueryData(queryKeys.communities.detail(id), (old) =>
        old ? { ...old, ...community } : old,
      );
      // And the matching list row so the sidebar preview stays in sync.
      qc.setQueryData(queryKeys.communities.list, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((entry) =>
          entry.community.id === id
            ? {
                ...entry,
                community: { ...entry.community, ...community },
              }
            : entry,
        );
      });
    },
  });
};

export const useDeleteCommunityMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.delete(endpoints.communities.detail(id)).then(() => id),
    onSuccess: (id) => {
      qc.setQueryData(queryKeys.communities.list, (old) =>
        Array.isArray(old)
          ? old.filter((entry) => entry.community.id !== id)
          : old,
      );
      qc.removeQueries({ queryKey: queryKeys.communities.detail(id) });
    },
  });
};

export const useLeaveCommunityMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.post(endpoints.communities.leave(id)).then(() => id),
    onSuccess: (id) => {
      qc.setQueryData(queryKeys.communities.list, (old) =>
        Array.isArray(old)
          ? old.filter((entry) => entry.community.id !== id)
          : old,
      );
      qc.removeQueries({ queryKey: queryKeys.communities.detail(id) });
    },
  });
};

export const useAddCommunityMembersMutation = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds) =>
      api
        .post(endpoints.communities.members(id), { userIds })
        .then((r) => r.data),
    onSuccess: ({ added }) => {
      // Patch the cached list's memberCount so the sidebar updates
      // without a refetch. The detail page will refetch member
      // objects via its own query when the sheet opens.
      qc.setQueryData(queryKeys.communities.list, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((entry) =>
          entry.community.id === id
            ? {
                ...entry,
                community: {
                  ...entry.community,
                  memberCount:
                    (entry.community.memberCount ?? 0) + (added?.length ?? 0),
                },
              }
            : entry,
        );
      });
      // Bust the detail cache because members[] inside is stale.
      qc.invalidateQueries({ queryKey: queryKeys.communities.detail(id) });
    },
  });
};

export const useRemoveCommunityMemberMutation = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) =>
      api
        .delete(endpoints.communities.member(id, targetUserId))
        .then(() => targetUserId),
    onSuccess: (targetUserId) => {
      qc.setQueryData(queryKeys.communities.detail(id), (old) =>
        old
          ? {
              ...old,
              members: (old.members ?? []).filter(
                (m) => m.userId !== targetUserId,
              ),
            }
          : old,
      );
      // Decrement the list-side counter to match.
      qc.setQueryData(queryKeys.communities.list, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((entry) =>
          entry.community.id === id
            ? {
                ...entry,
                community: {
                  ...entry.community,
                  memberCount: Math.max(
                    0,
                    (entry.community.memberCount ?? 0) - 1,
                  ),
                },
              }
            : entry,
        );
      });
    },
  });
};

export const useUpdateCommunityMemberRoleMutation = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ targetUserId, role }) =>
      api
        .patch(endpoints.communities.member(id, targetUserId), { role })
        .then(() => ({ targetUserId, role })),
    onSuccess: ({ targetUserId, role }) => {
      qc.setQueryData(queryKeys.communities.detail(id), (old) => {
        if (!old) return old;
        // Owner transfer: demote the previous owner to ADMIN, promote
        // the target to OWNER. Otherwise just flip the target's role.
        if (role === "OWNER") {
          return {
            ...old,
            members: (old.members ?? []).map((m) => {
              if (m.role === "OWNER")
                return { ...m, role: "ADMIN" };
              if (m.userId === targetUserId)
                return { ...m, role: "OWNER" };
              return m;
            }),
          };
        }
        return {
          ...old,
          members: (old.members ?? []).map((m) =>
            m.userId === targetUserId ? { ...m, role } : m,
          ),
        };
      });
    },
  });
};

// Sub-group attachment. Optimistically bumps the cached subGroupCount
// so the sidebar reflects the new total immediately. The full chat
// row arrives in the detail refetch.
export const useAddSubGroupMutation = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId) =>
      api
        .post(endpoints.communities.subGroups(id), { chatId })
        .then((r) => r.data),
    onSuccess: () => {
      qc.setQueryData(queryKeys.communities.list, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((entry) =>
          entry.community.id === id
            ? {
                ...entry,
                community: {
                  ...entry.community,
                  subGroupCount: (entry.community.subGroupCount ?? 0) + 1,
                },
              }
            : entry,
        );
      });
      qc.invalidateQueries({ queryKey: queryKeys.communities.detail(id) });
    },
  });
};

export const useRemoveSubGroupMutation = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId) =>
      api
        .delete(endpoints.communities.subGroup(id, chatId))
        .then(() => chatId),
    onSuccess: (chatId) => {
      qc.setQueryData(queryKeys.communities.detail(id), (old) =>
        old
          ? {
              ...old,
              chats: (old.chats ?? []).filter((c) => c.id !== chatId),
            }
          : old,
      );
      qc.setQueryData(queryKeys.communities.list, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((entry) =>
          entry.community.id === id
            ? {
                ...entry,
                community: {
                  ...entry.community,
                  subGroupCount: Math.max(
                    0,
                    (entry.community.subGroupCount ?? 0) - 1,
                  ),
                },
              }
            : entry,
        );
      });
    },
  });
};

// Idempotent per (user, community) on the server. We don't patch any
// cache because the user-visible state of "you've reported this" isn't
// surfaced anywhere — the success toast is the whole feedback loop.
export const useReportCommunityMutation = (id) => {
  return useMutation({
    mutationFn: (reason) =>
      api
        .post(endpoints.communities.report(id), { reason })
        .then((r) => r.data),
  });
};

export const useJoinCommunityMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (handle) =>
      api
        .post(endpoints.communities.join, { handle })
        .then((r) => r.data),
    onSuccess: () => {
      // Easiest correct thing: invalidate so the new community row
      // shows up next render. Cheap (one query, cached forever after).
      qc.invalidateQueries({ queryKey: queryKeys.communities.list });
    },
  });
};
