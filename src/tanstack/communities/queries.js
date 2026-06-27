import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

// Settings-style cache contract: staleTime Infinity, no refetch on
// focus/mount. The realtime sync hook patches the cache when
// COMMUNITY_ADDED / COMMUNITY_REMOVED / COMMUNITY_UPDATE arrive.
const LIVE = {
  staleTime: Infinity,
  // gcTime: Infinity for IndexedDB-persisted communities list/detail.
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

export const useCommunitiesQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.communities.list,
    queryFn: () => api.get(endpoints.communities.list).then((r) => r.data),
    enabled: !!accessToken,
    ...LIVE,
  });
};

export const useCommunityQuery = (id) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.communities.detail(id),
    queryFn: () =>
      api.get(endpoints.communities.detail(id)).then((r) => r.data),
    enabled: !!id && !!accessToken,
    ...LIVE,
  });
};

// Public — no auth required. Used by the /c/[handle] invite landing
// page to render the join CTA. Short stale time (1 min) because this
// is only fetched once per landing page render and the member count
// can change between visits.
export const useCommunityByHandleQuery = (handle) => {
  return useQuery({
    queryKey: queryKeys.communities.byHandle(handle ?? ""),
    queryFn: () =>
      api.get(endpoints.communities.byHandle(handle)).then((r) => r.data),
    enabled: !!handle,
    staleTime: 1000 * 60,
  });
};
