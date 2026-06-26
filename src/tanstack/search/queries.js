import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export const useGlobalSearchQuery = (query) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.search.global(query ?? ""),
    queryFn: () =>
      api
        .get(endpoints.search.global, { params: { q: query } })
        .then((r) => r.data),
    enabled: !!accessToken && !!query && query.trim().length > 0,
    staleTime: 1000 * 15,
  });
};

export const useChatSearchQuery = (chatId, query) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.search.chat(chatId ?? "", query ?? ""),
    queryFn: () =>
      api
        .get(endpoints.search.chat(chatId), { params: { q: query } })
        .then((r) => r.data),
    enabled:
      !!accessToken && !!chatId && !!query && query.trim().length > 0,
    staleTime: 1000 * 15,
  });
};
