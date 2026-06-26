import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { PAGE_SIZE } from "@/config/constants";

// Infinite query over messages. Each page is `{ messages: [], nextCursor }`.
// Pages are ordered oldest→newest within each page; the *first* page returned
// is the most recent page (i.e. message-list renders pages in reverse).
export const useMessagesQuery = (chatId) =>
  useInfiniteQuery({
    queryKey: queryKeys.messages.list(chatId),
    queryFn: ({ pageParam = null }) =>
      api
        .get(endpoints.chats.messages(chatId), {
          params: { cursor: pageParam, limit: PAGE_SIZE.MESSAGES },
        })
        .then((r) => r.data),
    initialPageParam: null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!chatId && !!useAuthStore.getState().accessToken,
    staleTime: 1000 * 30,
  });

export const useStarredMessagesQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.messages.starred,
    queryFn: () => api.get(endpoints.messages.starred).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60,
  });
};
