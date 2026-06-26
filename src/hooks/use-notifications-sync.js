"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSocketStore } from "@/stores/socket-store";
import { queryKeys } from "@/config/query-keys";
import { SOCKET_EVENT } from "@/config/constants";

// Listens for `notification:new` and patches the notifications cache in
// place. Avoids a full refetch on every notification — important when the
// user is opening many request cards in a row.
export function useNotificationsSync() {
  const socket = useSocketStore((s) => s.socket);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;

    const onNew = (notification) => {
      qc.setQueryData(queryKeys.notifications.list, (old) => {
        if (!old) return { items: [notification], unread: 1 };
        // De-dupe in case the server-sent event arrives twice (e.g. retry).
        if (old.items.some((n) => n.id === notification.id)) return old;
        return {
          items: [notification, ...old.items].slice(0, 100),
          unread: (old.unread ?? 0) + 1,
        };
      });
    };

    socket.on(SOCKET_EVENT.NOTIFICATION_NEW, onNew);
    return () => socket.off(SOCKET_EVENT.NOTIFICATION_NEW, onNew);
  }, [socket, qc]);
}
