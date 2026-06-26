"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSocketStore } from "@/stores/socket-store";
import { queryKeys } from "@/config/query-keys";
import { SOCKET_EVENT } from "@/config/constants";

// Always-on listener. Keeps every call-related cache fresh so the call log
// updates live and any open call screen sees status transitions from the
// peer (declined, answered, ended) without polling.
export function useCallEvents() {
  const socket = useSocketStore((s) => s.socket);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;

    const refreshLog = () => {
      qc.invalidateQueries({ queryKey: queryKeys.calls.log });
    };

    // Status transition for a specific call. Patch the cached detail so the
    // call screen reacts instantly + refresh the log so the row updates.
    const onCallUpdate = ({ callId, status, startedAt, endedAt }) => {
      qc.setQueryData(["calls", "detail", callId], (old) => {
        if (!old) return old;
        return {
          ...old,
          status,
          startedAt: startedAt ?? old.startedAt,
          endedAt: endedAt ?? old.endedAt,
        };
      });
      refreshLog();
    };

    socket.on(SOCKET_EVENT.CALL_UPDATE, onCallUpdate);
    socket.on(SOCKET_EVENT.CALL_LOG_UPDATE, refreshLog);
    // A fresh ringing call needs to land in the log even if the user is
    // looking at /calls when it arrives.
    socket.on(SOCKET_EVENT.CALL_OFFER, refreshLog);

    return () => {
      socket.off(SOCKET_EVENT.CALL_UPDATE, onCallUpdate);
      socket.off(SOCKET_EVENT.CALL_LOG_UPDATE, refreshLog);
      socket.off(SOCKET_EVENT.CALL_OFFER, refreshLog);
    };
  }, [socket, qc]);
}
