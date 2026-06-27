import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

// Per-keystroke search queries (C11 audit matrix). Each typed value
// becomes its own cache entry, so we keep `gcTime` short — without it
// the default 5-minute window holds every typo the user ever made.
// `staleTime` stays moderate so re-typing the same query within a few
// seconds returns the cached result instantly.
const SEARCH_CACHE = {
  staleTime: 1000 * 15,
  gcTime: 1000 * 60,
};

export const useGlobalSearchQuery = (query) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.search.global(query ?? ""),
    queryFn: () =>
      api
        .get(endpoints.search.global, { params: { q: query } })
        .then((r) => r.data),
    enabled: !!accessToken && !!query && query.trim().length > 0,
    ...SEARCH_CACHE,
  });
};

// Global cross-chat message search. Press-enter only — `query` here is
// the COMMITTED value (not the live input). The page passes "" until
// the user submits, which keeps `enabled` false and the network quiet.
export const useMessageSearchQuery = (query) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.search.messages(query ?? ""),
    queryFn: () =>
      api
        .get(endpoints.search.messages, { params: { q: query } })
        .then((r) => r.data),
    enabled: !!accessToken && !!query && query.trim().length > 0,
    ...SEARCH_CACHE,
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
    ...SEARCH_CACHE,
  });
};
