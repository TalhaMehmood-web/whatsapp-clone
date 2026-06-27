import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { PAGE_SIZE } from "@/config/constants";

// Infinite query over messages. Each page is `{ messages: [], nextCursor }`.
// Pages are ordered oldest→newest within each page; the *first* page returned
// is the most recent page (i.e. message-list renders pages in reverse).
//
// Stale time is Infinity because every relevant server-side change
// (message:new, edited, deleted, purged, reaction, pinned, read) is
// pushed into the cache by use-chat-socket-sync. Switching tabs or
// remounting the chat thread used to fire a fresh fetch every 30s;
// after the Pusher migration that's pure waste — the cache is already
// live. Older messages are loaded explicitly via fetchNextPage().
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
    staleTime: Infinity,
    // gcTime: Infinity is what makes the IndexedDB-persisted message
    // history actually load from disk on every revisit — the default
    // gcTime: 5min would evict the entry before persistence could
    // rehydrate it. WhatsApp Web's local SQLite mirror behaviour.
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
