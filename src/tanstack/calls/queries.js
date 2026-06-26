import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export const useCallLogQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.calls.log,
    queryFn: () => api.get(endpoints.calls.list).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60,
  });
};

export const useCallQuery = (id) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["calls", "detail", id],
    queryFn: () => api.get(endpoints.calls.detail(id)).then((r) => r.data),
    enabled: !!id && !!accessToken,
  });
};
