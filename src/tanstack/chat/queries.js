import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { CHAT_TAB } from "@/config/constants";

// Why `staleTime: Infinity` on the four chat-list queries below:
//
// Before realtime, these refetched every 30–60s to stay fresh. After
// the Pusher migration, `use-chat-socket-sync` patches every cached
// chats.list / chats.detail entry in response to the message:new,
// message:read, group:added, group:removed, group:update events. The
// cache is therefore the live source of truth for the whole session,
// and refetching just bills bandwidth without producing new data.
//
// We also turn off `refetchOnWindowFocus` and `refetchOnMount` for the
// same reason — both fire fresh GETs every time you switch tabs or
// navigate back to a screen, which is exactly the symptom the user
// reported ("each visit to a chat fires 5+ requests").
//
// The rare cases where the realtime stream can't reconstruct truth
// from the event (cold cache on group-added, group-update header
// changes) are already handled inside use-chat-socket-sync via an
// explicit invalidateQueries call. Those are scoped to one chat and
// only fire on real events, not on navigation.

const LIVE_CHAT_QUERY_DEFAULTS = {
  staleTime: Infinity,
  // gcTime: Infinity makes the IndexedDB-persisted chat list + detail
  // actually survive page reloads — the default 5-min gcTime would
  // evict the entry before the persister rehydrates it. WhatsApp Web
  // mirrors chats locally for the same reason.
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

// `filters` shape: { tab: CHAT_TAB.*, search? }
export const useChatsQuery = (filters = { tab: CHAT_TAB.ALL }) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.chats.list(filters),
    queryFn: () =>
      api
        .get(endpoints.chats.list, { params: filters })
        .then((r) => r.data),
    enabled: !!accessToken,
    ...LIVE_CHAT_QUERY_DEFAULTS,
  });
};

// Single chat for the chat header (returns { chat, peers }).
export const useChatQuery = (chatId) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.chats.detail(chatId),
    queryFn: () =>
      api.get(endpoints.chats.detail(chatId)).then((r) => r.data),
    enabled: !!chatId && !!accessToken,
    ...LIVE_CHAT_QUERY_DEFAULTS,
  });
};

// Archived chats + count. The count powers the "Archived (N)" pill at the
// top of the main chat list; the list itself feeds the /archived page.
// Shared cache key means a single fetch satisfies both consumers.
export const useArchivedChatsQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.chats.archived,
    queryFn: () => api.get(endpoints.chats.archived).then((r) => r.data),
    enabled: !!accessToken,
    ...LIVE_CHAT_QUERY_DEFAULTS,
  });
};

// Locked chats + count. Same shape as useArchivedChatsQuery. The count
// powers the "Locked chats" row above the main chat list; the list feeds
// the /locked screen. `enabled` lets the caller defer the fetch until
// after secret-code verification.
export const useLockedChatsQuery = ({ enabled = true } = {}) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.chats.locked,
    queryFn: () => api.get(endpoints.chats.locked).then((r) => r.data),
    enabled: !!accessToken && enabled,
    ...LIVE_CHAT_QUERY_DEFAULTS,
  });
};

// Whether the current user has a global secret code set. Used by the
// lock-chat dropdown to branch between "set up secret" and "lock now".
export const useLockedChatsSecretStatusQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["auth", "lockedChatsSecret"],
    queryFn: () =>
      api.get(endpoints.users.lockedChatsSecret).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: Infinity,
  });
};

// Media catalogue powering the "Media, links, docs" browser. Lazy: only
// runs when the sheet asks for it via `enabled`.
export const useChatMediaQuery = (chatId, { enabled = true } = {}) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.chats.media(chatId),
    queryFn: () =>
      api.get(endpoints.chats.media(chatId)).then((r) => r.data),
    enabled: !!chatId && !!accessToken && enabled,
    staleTime: 1000 * 30,
  });
};
