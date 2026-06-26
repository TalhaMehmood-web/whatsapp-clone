"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/stores/auth-store";
import { useSocketStore } from "@/stores/socket-store";
import { useRealtimeStore } from "@/stores/realtime-store";
import { connect, disconnect } from "@/lib/realtime/client";
import { createBus } from "@/lib/realtime/bus";
import { endpoints } from "@/config/endpoints";

// Opens (and tears down) the realtime connection when the auth token
// changes. Mounted once, inside an authenticated boundary (the AppShell).
//
// History: this hook used to wrap socket.io-client. After the Pusher
// migration it builds a `bus` that exposes the same `on`/`off` shape so
// every existing sync hook (use-chat-socket-sync, use-friend-requests-sync,
// use-notifications-sync, use-call-events, use-typing-indicator, etc.)
// keeps working unchanged. The file name stays the same so import paths
// don't churn — see also `useSocketStore.socket` which is now an alias
// for the bus.
export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id);
  const setSocket = useSocketStore((s) => s.setSocket);
  const setConnected = useSocketStore((s) => s.setConnected);
  const setRtHandle = useRealtimeStore((s) => s.setHandle);
  const setRtBus = useRealtimeStore((s) => s.setBus);
  const setRtConnected = useRealtimeStore((s) => s.setConnected);

  useEffect(() => {
    if (!accessToken) return undefined;

    const handle = connect({
      accessToken,
      authEndpoint: endpoints.realtime.auth,
    });
    if (!handle) return undefined;

    const bus = createBus(handle, { selfUserId: userId });

    // Mirror the connection state into BOTH stores so any consumer —
    // legacy or new — sees the same flag.
    const unbindConn = bus.bindConnectionState((isConnected) => {
      setConnected(isConnected);
      setRtConnected(isConnected);
    });

    setSocket(bus);
    setRtHandle(handle);
    setRtBus(bus);

    return () => {
      unbindConn();
      bus.teardown();
      disconnect(handle);
      setSocket(null);
      setRtHandle(null);
      setRtBus(null);
      setConnected(false);
      setRtConnected(false);
    };
  }, [
    accessToken,
    userId,
    setSocket,
    setConnected,
    setRtHandle,
    setRtBus,
    setRtConnected,
  ]);
}
