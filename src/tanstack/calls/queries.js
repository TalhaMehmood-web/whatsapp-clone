import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

// Call log warm-loads from IndexedDB the same way chats do: gcTime
// Infinity so the persister rehydrates instantly on reload. Mutations
// + realtime CALL_LOG_UPDATE keep it fresh — no refetch on mount/focus.
export const useCallLogQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.calls.log,
    queryFn: () => api.get(endpoints.calls.list).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
