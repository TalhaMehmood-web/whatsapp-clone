import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export const useCommunitiesQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.communities.list,
    queryFn: () => api.get(endpoints.communities.list).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60,
  });
};

export const useCommunityQuery = (id) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.communities.detail(id),
    queryFn: () =>
      api.get(endpoints.communities.detail(id)).then((r) => r.data),
    enabled: !!id && !!accessToken,
    staleTime: 1000 * 60,
  });
};
