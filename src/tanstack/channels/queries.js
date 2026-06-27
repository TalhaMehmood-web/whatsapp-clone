import {
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

// Settings-style cache contract. The realtime sync hook patches the
// cache when CHANNEL_POST_NEW arrives, so we don't refetch on focus
// or mount.
const LIVE = {
  staleTime: Infinity,
  // gcTime: Infinity so the IndexedDB-persisted channel list/posts
  // survive page reloads. Realtime keeps the cache live; persistence
  // makes it warm-start.
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

export const useChannelsQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.channels.list,
    queryFn: () => api.get(endpoints.channels.list).then((r) => r.data),
    enabled: !!accessToken,
    ...LIVE,
  });
};

export const useChannelQuery = (id) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.channels.detail(id),
    queryFn: () =>
      api.get(endpoints.channels.detail(id)).then((r) => r.data),
    enabled: !!id && !!accessToken,
    ...LIVE,
  });
};

// Public — invite-link landing page calls this without auth and still
// gets back isOwner/isSubscribed flags scoped to the optional auth
// header. Short stale time because this is a one-off landing render.
export const useChannelByHandleQuery = (handle) => {
  return useQuery({
    queryKey: queryKeys.channels.byHandle(handle ?? ""),
    queryFn: () =>
      api.get(endpoints.channels.byHandle(handle)).then((r) => r.data),
    enabled: !!handle,
    staleTime: 1000 * 60,
  });
};

// Discover surface. Search is server-side press-enter (C11 matrix) —
// caller passes the submitted query as `q`, which becomes part of the
// cache key. Trending + friends-also-subscribe come back in the same
// response.
//
// The empty-query case (trending) caches forever because the result
// is stable for the session. Per-query entries get a short gcTime so
// a user who searched ten things doesn't carry all ten payloads
// around for the rest of the session.
export const useChannelsExploreQuery = (q) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.channels.explore(q),
    queryFn: () =>
      api
        .get(endpoints.channels.explore, { params: q ? { q } : {} })
        .then((r) => r.data),
    enabled: !!accessToken,
    staleTime: q ? 1000 * 30 : Infinity,
    gcTime: q ? 1000 * 60 : Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Paginated post feed. Subscribers + owners. Pages are newest-first.
export const useChannelPostsQuery = (channelId) =>
  useInfiniteQuery({
    queryKey: queryKeys.channels.posts(channelId),
    queryFn: ({ pageParam = null }) =>
      api
        .get(endpoints.channels.posts(channelId), {
          params: { cursor: pageParam, limit: 20 },
        })
        .then((r) => r.data),
    initialPageParam: null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!channelId && !!useAuthStore.getState().accessToken,
    ...LIVE,
  });

// Threaded replies for a single post — loaded on-demand when the
// thread sheet opens. `enabled` defers until the surface is visible.
export const useChannelPostRepliesQuery = (
  postId,
  { enabled = true } = {},
) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.channels.replies(postId),
    queryFn: () =>
      api
        .get(endpoints.channels.postReplies(postId))
        .then((r) => r.data.replies),
    enabled: !!postId && !!accessToken && enabled,
    ...LIVE,
  });
};

// Admin roster (owner + co-admins). Subscribers + managers can read.
// `enabled` defers until the info sheet asks for it.
export const useChannelAdminsQuery = (channelId, { enabled = true } = {}) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.channels.admins(channelId),
    queryFn: () =>
      api.get(endpoints.channels.admins(channelId)).then((r) => r.data),
    enabled: !!channelId && !!accessToken && enabled,
    ...LIVE,
  });
};

// Subscribers list. Server gates the rows by friend-overlap when the
// caller isn't an owner/admin. The `gated` boolean in the response is
// used by the UI to render a hint about the privacy filter.
export const useChannelSubscribersQuery = (
  channelId,
  { enabled = true } = {},
) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.channels.subscribers(channelId),
    queryFn: () =>
      api.get(endpoints.channels.subscribers(channelId)).then((r) => r.data),
    enabled: !!channelId && !!accessToken && enabled,
    ...LIVE,
  });
};
