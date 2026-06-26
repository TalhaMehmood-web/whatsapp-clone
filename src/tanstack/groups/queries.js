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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
