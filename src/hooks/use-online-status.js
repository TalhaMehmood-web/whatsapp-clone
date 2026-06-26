"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSocketStore } from "@/stores/socket-store";
import { queryKeys } from "@/config/query-keys";

// Drives the "online" dot + last-seen line on every cached chat list /
// chat detail. Bound to the realtime provider's presence channel:
//
//   - On initial subscribe, the channel emits the full member list →
//     patch each cached row with `isOnline: true`.
//   - When a member joins, mark that user online.
//   - When a member leaves, mark that user offline + stamp `lastSeen`
//     with the current time (matches the old USER_OFFLINE shape).
//
// History: this used to listen for USER_ONLINE / USER_OFFLINE events on
// Socket.io that the custom server emitted manually on connect/disconnect.
// Pusher Channels provides this natively via presence channels, so we
// drop the manual emits and read from the presence list instead.
export function useOnlineStatusSync() {
  const socket = useSocketStore((s) => s.socket);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;

    const patch = (userId, isOnline, lastSeen) => {
      qc.getQueriesData({ queryKey: queryKeys.chats.all }).forEach(
        ([key, data]) => {
          if (!data) return;

          if (Array.isArray(data)) {
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

    const unbind = socket.bindPresence({
      onMembers: (members) => {
        for (const m of members) patch(m.id, true);
      },
      onJoin: (member) => patch(member.id, true),
      onLeave: (member) => patch(member.id, false, new Date().toISOString()),
    });

    return () => {
      unbind();
    };
  }, [socket, qc]);
}
