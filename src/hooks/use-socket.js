"use client";

import { useEffect } from "react";
import { io as createSocket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth-store";
import { useSocketStore } from "@/stores/socket-store";

// Opens (and tears down) the Socket.IO connection when the auth token
// changes. Designed to be mounted exactly once, inside an authenticated
// boundary (the AppShell). Other hooks read the live socket via
// `useSocketStore` instead of re-creating it.
export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSocket = useSocketStore((s) => s.setSocket);
  const setConnected = useSocketStore((s) => s.setConnected);

  useEffect(() => {
    if (!accessToken) return undefined;

    const socket = createSocket({
      path: "/socket.io",
      auth: { token: accessToken },
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    setSocket(socket);

    return () => {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [accessToken, setSocket, setConnected]);
}
