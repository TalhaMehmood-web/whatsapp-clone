import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export const useGroupMembersQuery = (chatId) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.chats.members(chatId),
    queryFn: () =>
      api.get(endpoints.chats.members(chatId)).then((r) => r.data),
    enabled: !!chatId && !!accessToken,
    staleTime: 1000 * 60,
  });
};
