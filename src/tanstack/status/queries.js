import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

// Returns { mine: Status[], contacts: { user, statuses, allViewed }[] }.
export const useStatusFeedQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.status.all,
    queryFn: () => api.get(endpoints.status.list).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 30,
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
    staleTime: 1000 * 30,
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
