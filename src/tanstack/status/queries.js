import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

// Returns { mine: Status[], contacts: { user, statuses, allViewed }[] }.
// staleTime + gcTime: Infinity so the IndexedDB-persisted status feed
// warm-loads instantly on reload AND doesn't refire on every navigation
// to /status. Realtime STATUS_NEW + STATUS_DELETED keep it live;
// useStatusSync invalidates this key when fanout arrives, the 24h
// server TTL naturally drops expired entries on the next refetch.
export const useStatusFeedQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.status.all,
    queryFn: () => api.get(endpoints.status.list).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Returns the full ordered reel of one author's still-live statuses.
// Used by the viewer route /status/[authorId].
export const useStatusAuthorReelQuery = (authorId) =>
  useQuery({
    queryKey: queryKeys.status.author(authorId),
    queryFn: () =>
      api.get(endpoints.status.author(authorId)).then((r) => r.data),
    enabled: !!authorId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

// Author-only — who has seen a given status.
export const useStatusViewersQuery = (statusId, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.status.viewers(statusId),
    queryFn: () =>
      api.get(endpoints.status.viewers(statusId)).then((r) => r.data),
    enabled: !!statusId && enabled,
    staleTime: 1000 * 15,
  });
