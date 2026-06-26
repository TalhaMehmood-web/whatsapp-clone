import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

// The /me row is the source of truth for Profile / Account screens AND
// it's read by useAuth() from every screen that needs the current user.
// All mutations that change the row (name, about, avatar, security
// notifications, delete-account) patch this cache via setQueryData, so
// the cached value is canonical for the whole session. Keeping it warm
// forever cuts the refetch every screen used to fire on focus.
export const useMeQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.get(endpoints.auth.me).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: Infinity,
  });
};
