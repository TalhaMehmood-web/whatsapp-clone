import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

// Returns { items: Notification[], unread: number }. Polled lightly so a
// stale dropdown view eventually catches up if the socket event was missed
// (e.g. flaky network).
export const useNotificationsQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: () => api.get(endpoints.notifications.list).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
};
