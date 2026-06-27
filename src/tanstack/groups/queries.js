import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

// Stale time is Infinity because:
//   - User-initiated changes (add/remove/role change) invalidate this
//     key directly in groups/mutations.js.
//   - Peer-initiated changes fire GROUP_UPDATE over Pusher, which the
//     chat sync hook invalidates here too.
// So the cache is always live without remounting GETs on every navigate.
export const useGroupMembersQuery = (chatId) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.chats.members(chatId),
    queryFn: () =>
      api.get(endpoints.chats.members(chatId)).then((r) => r.data),
    enabled: !!chatId && !!accessToken,
    staleTime: Infinity,
    // gcTime: Infinity so group-members surface (info sheet, member
    // mentions, etc.) warm-starts from IndexedDB on reload.
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Public peek for the /g/{handle} invite landing page. Works without
// auth (the route handler is public). Short staleTime because the
// member count + name should look fresh when the visitor lands.
export const useGroupByInviteHandleQuery = (handle) =>
  useQuery({
    queryKey: queryKeys.groups.byInviteHandle(handle),
    queryFn: () =>
      api.get(endpoints.groups.byInviteHandle(handle)).then((r) => r.data),
    enabled: !!handle,
    staleTime: 30_000,
    retry: false,
  });
