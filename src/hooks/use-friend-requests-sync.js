"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSocketStore } from "@/stores/socket-store";
import { queryKeys } from "@/config/query-keys";
import { SOCKET_EVENT } from "@/config/constants";

// Receives friend-request lifecycle events from the server and invalidates
// the relevant tanstack caches. Mounted once inside SocketBoundary so the
// UI updates without a manual refresh.
export function useFriendRequestsSync() {
  const socket = useSocketStore((s) => s.socket);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = () => {
      qc.invalidateQueries({ queryKey: queryKeys.friendRequests.incoming });
      qc.invalidateQueries({ queryKey: queryKeys.friendRequests.outgoing });
      qc.invalidateQueries({ queryKey: queryKeys.friendRequests.friends });
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
    };

    const onIncoming = (req) => {
      toast.success(`New friend request from @${req.from?.handle ?? "?"}`);
      refresh();
    };
    const onUpdate = (req) => {
      if (req.status === "ACCEPTED") {
        toast.success(`@${req.from?.handle ?? "?"} and you are now friends`);
      }
      refresh();
    };
    const onCancel = () => refresh();

    socket.on(SOCKET_EVENT.FRIEND_REQUEST, onIncoming);
    socket.on(SOCKET_EVENT.FRIEND_REQUEST_UPDATE, onUpdate);
    socket.on(SOCKET_EVENT.FRIEND_REQUEST_CANCEL, onCancel);

    return () => {
      socket.off(SOCKET_EVENT.FRIEND_REQUEST, onIncoming);
      socket.off(SOCKET_EVENT.FRIEND_REQUEST_UPDATE, onUpdate);
      socket.off(SOCKET_EVENT.FRIEND_REQUEST_CANCEL, onCancel);
    };
  }, [socket, qc]);
}
