"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/stores/socket-store";
import { queryKeys } from "@/config/query-keys";
import { SOCKET_EVENT } from "@/config/constants";

// Listens for user:online / user:offline and patches every cached chat.detail
// + chat.list so avatars + presence labels stay live.
export function useOnlineStatusSync() {
  const socket = useSocketStore((s) => s.socket);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;

    const patch = (userId, isOnline, lastSeen) => {
      // chats.detail entries: peers[].isOnline
      qc.getQueriesData({ queryKey: queryKeys.chats.all }).forEach(
        ([key, data]) => {
          if (!data) return;

          if (Array.isArray(data)) {
            // chats.list cache
            qc.setQueryData(
              key,
              data.map((entry) => ({
                ...entry,
                peers: (entry.peers ?? []).map((p) =>
                  p.id === userId
                    ? { ...p, isOnline, lastSeen: lastSeen ?? p.lastSeen }
                    : p,
                ),
              })),
            );
            return;
          }

          if (data.peers) {
            // chats.detail cache
            qc.setQueryData(key, {
              ...data,
              peers: data.peers.map((p) =>
                p.id === userId
                  ? { ...p, isOnline, lastSeen: lastSeen ?? p.lastSeen }
                  : p,
              ),
            });
          }
        },
      );
    };

    const onOnline = ({ userId }) => patch(userId, true);
    const onOffline = ({ userId, lastSeen }) =>
      patch(userId, false, lastSeen);

    socket.on(SOCKET_EVENT.USER_ONLINE, onOnline);
    socket.on(SOCKET_EVENT.USER_OFFLINE, onOffline);

    return () => {
      socket.off(SOCKET_EVENT.USER_ONLINE, onOnline);
      socket.off(SOCKET_EVENT.USER_OFFLINE, onOffline);
    };
  }, [socket, qc]);
}
