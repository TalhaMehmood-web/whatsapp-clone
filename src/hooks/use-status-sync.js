"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSocketStore } from "@/stores/socket-store";
import { queryKeys } from "@/config/query-keys";
import { SOCKET_EVENT } from "@/config/constants";

// Listens for status fanout events on the user's private channel.
// Fired by lib/status.js → fanoutStatusToFriends() whenever a friend
// posts or deletes a status.
//
// We invalidate rather than cache-patch because the feed shape includes
// grouped sub-objects (per-author bucket with allViewed flag, sort by
// most-recent activity). A correct patch would need to re-derive both,
// which is more error-prone than a single GET. The list query is
// staleTime: Infinity normally, so this invalidate is exactly what
// triggers the refresh.
//
// Also bust the per-author detail cache (useStatusByAuthorQuery) for
// the affected author so the viewer picks up the new/removed story
// if it's currently open.
export function useStatusSync() {
  const socket = useSocketStore((s) => s.socket);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;

    const onFanout = (payload) => {
      qc.invalidateQueries({ queryKey: queryKeys.status.list });
      if (payload?.authorId) {
        qc.invalidateQueries({
          queryKey: queryKeys.status.author(payload.authorId),
        });
      }
    };

    socket.on(SOCKET_EVENT.STATUS_NEW, onFanout);
    socket.on(SOCKET_EVENT.STATUS_DELETED, onFanout);

    return () => {
      socket.off(SOCKET_EVENT.STATUS_NEW, onFanout);
      socket.off(SOCKET_EVENT.STATUS_DELETED, onFanout);
    };
  }, [socket, qc]);
}
