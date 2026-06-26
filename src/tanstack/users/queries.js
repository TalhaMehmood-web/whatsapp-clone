import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export const useSearchUsersQuery = (query) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.users.search(query ?? ""),
    queryFn: () =>
      api
        .get(endpoints.users.list, { params: { search: query } })
        .then((r) => r.data),
    enabled: !!accessToken && !!query && query.trim().length > 0,
    staleTime: 1000 * 30,
  });
};

export const usePrivacyQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.users.privacy,
    queryFn: () => api.get(endpoints.users.privacy).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60,
  });
};

export const useChatPrefsQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.users.chatPrefs,
    queryFn: () => api.get(endpoints.users.chatPrefs).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60,
  });
};

export const useBlockedUsersQuery = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.users.blocked,
    queryFn: () => api.get(endpoints.users.blocked).then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 1000 * 60,
  });
};

export const usePublicProfileQuery = (handle) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const normalised = handle?.toLowerCase();
  return useQuery({
    queryKey: queryKeys.users.byHandle(normalised ?? ""),
    queryFn: () =>
      api.get(endpoints.users.byHandle(normalised)).then((r) => r.data),
    enabled: !!accessToken && !!normalised,
    staleTime: 1000 * 60,
  });
};
