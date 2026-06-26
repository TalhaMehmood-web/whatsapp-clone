import { useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { queryKeys } from "@/config/query-keys";
import { useAuthStore } from "@/stores/auth-store";

const enabled = () => !!useAuthStore.getState().accessToken;

export const useIncomingFriendRequestsQuery = () =>
  useQuery({
    queryKey: queryKeys.friendRequests.incoming,
    queryFn: () =>
      api
        .get(endpoints.friendRequests.list, {
          params: { direction: "incoming" },
        })
        .then((r) => r.data),
    enabled: enabled(),
    staleTime: 1000 * 30,
  });

export const useOutgoingFriendRequestsQuery = () =>
  useQuery({
    queryKey: queryKeys.friendRequests.outgoing,
    queryFn: () =>
      api
        .get(endpoints.friendRequests.list, {
          params: { direction: "outgoing" },
        })
        .then((r) => r.data),
    enabled: enabled(),
    staleTime: 1000 * 30,
  });

export const useFriendsQuery = () =>
  useQuery({
    queryKey: queryKeys.friendRequests.friends,
    queryFn: () => api.get(endpoints.friendRequests.friends).then((r) => r.data),
    enabled: enabled(),
    staleTime: 1000 * 60,
  });
