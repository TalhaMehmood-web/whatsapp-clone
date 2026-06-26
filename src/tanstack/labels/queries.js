import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export const useLabelsQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.labels.list,
    queryFn: () => api.get(endpoints.labels.list).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
};
