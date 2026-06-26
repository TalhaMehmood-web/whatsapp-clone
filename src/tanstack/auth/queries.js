import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export const useMeQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.get(endpoints.auth.me).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
};
