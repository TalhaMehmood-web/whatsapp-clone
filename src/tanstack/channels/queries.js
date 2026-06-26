import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export const useChannelsQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.channels.list,
    queryFn: () => api.get(endpoints.channels.list).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60,
  });
};

export const useChannelQuery = (id) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.channels.detail(id),
    queryFn: () =>
      api.get(endpoints.channels.detail(id)).then((r) => r.data),
    enabled: !!id && !!accessToken,
    staleTime: 1000 * 60,
  });
};
