import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

// Server-side debounced search (see C11 audit matrix). The cache key
// includes the query string, so every typed query is its own entry.
// We keep `staleTime` moderate (30s) so re-typing the same query
// returns cached results without hitting the server, and we set
// `gcTime` short so abandoned typo-y cache entries don't accumulate
// — without this, every typed character would live in cache for the
// default 5 minutes.
export const useSearchUsersQuery = (query) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.users.search(query ?? ""),
    queryFn: () =>
      api
        .get(endpoints.users.list, { params: { search: query } })
        .then((r) => r.data),
    enabled: !!accessToken && !!query && query.trim().length > 0,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60,
  });
};

// Privacy is purely user-driven — it only changes when the user toggles
// a row in Settings → Privacy, and every mutation patches the cache. We
// can safely treat the cached value as canonical for the whole session.
export const usePrivacyQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.users.privacy,
    queryFn: () => api.get(endpoints.users.privacy).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: Infinity,
  });
};

// Lightweight friends list for the Privacy exception picker. Sorted by
// name server-side; cached for the whole session since it only changes
// when a friend request is accepted (the friend-request socket listener
// invalidates the key when needed).
export const useEligibleContactsQuery = ({ enabled = true } = {}) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.users.eligibleContacts,
    queryFn: () =>
      api.get(endpoints.users.eligibleContacts).then((r) => r.data.contacts),
    enabled: !!accessToken && enabled,
    staleTime: Infinity,
  });
};

// Same rationale as usePrivacyQuery — the chat-prefs row is the source
// for theme / wallpaper / composer flags / upload quality / auto-download.
// Hot path: every chat bubble + the composer read from this cache. We
// keep it warm forever so a navigation back to /settings never refetches.
//
// `select` lets a hot-path consumer (e.g. ChatWallpaper) subscribe to a
// single field. TanStack memoizes the projection, so changing an
// unrelated field (e.g. enterIsSend) never re-renders the wallpaper.
// Pass a stable function reference — module-level constants are perfect.
export const useChatPrefsQuery = ({ select } = {}) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.users.chatPrefs,
    queryFn: () => api.get(endpoints.users.chatPrefs).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: Infinity,
    select,
  });
};

// Notification kind toggles (Messages/Groups/Status/reactionSounds).
// Cached for the whole session — only changes when the user toggles a row
// in Settings → Notifications, which patches the cache via the mutation.
export const useNotifPrefsQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.users.notifPrefs,
    queryFn: () => api.get(endpoints.users.notifPrefs).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: Infinity,
  });
};

// Blocked-users list is only ever mutated by useBlockUserMutation /
// useUnblockUserMutation, both of which patch this cache directly.
// Cached forever to skip the refetch on every chat open + every Privacy
// pane visit.
export const useBlockedUsersQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.users.blocked,
    queryFn: () => api.get(endpoints.users.blocked).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: Infinity,
  });
};

export const usePublicProfileQuery = (handle) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const normalised = handle?.toLowerCase();
  return useQuery({
    queryKey: queryKeys.users.byHandle(normalised ?? ""),
    queryFn: () =>
      api.get(endpoints.users.byHandle(normalised)).then((r) => r.data),
    enabled: !!accessToken && !!normalised,
    staleTime: 1000 * 60,
  });
};
