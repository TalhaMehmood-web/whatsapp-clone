import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { CHAT_TAB } from "@/config/constants";

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
    staleTime: 1000 * 30,
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
    staleTime: 1000 * 60,
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
    staleTime: 1000 * 30,
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
    staleTime: 1000 * 30,
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
