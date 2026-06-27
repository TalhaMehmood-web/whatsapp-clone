"use client";

import { useEffect } from "react";

import api from "@/config/axios-instance";
import { endpoints } from "@/config/endpoints";
import { useAuthStore } from "@/stores/auth-store";

const HEARTBEAT_MS = 60_000;

// Module-scoped throttle. Survives effect tear-downs from React Strict
// Mode, route re-renders, or anything else that might cause the hook to
// re-mount and re-fire its setup `ping()` more often than once a minute.
// Also gates the visibility-change handler so rapid tab-switches don't
// each fire a heartbeat.
let lastPingAt = 0;
let intervalId = null;
let visibilityBound = false;

async function ping() {
  if (typeof document !== "undefined" && document.hidden) return;
  if (Date.now() - lastPingAt < HEARTBEAT_MS) return;
  lastPingAt = Date.now();
  try {
    await api.post(endpoints.users.heartbeat);
  } catch {
    // Roll back so the next legitimate call isn't blocked behind a
    // failed timestamp.
    lastPingAt = 0;
  }
}

// Per-session presence ping. Posts to /users/me/heartbeat at most once
// every 60s while the tab is visible so the server can stamp lastSeen
// + isOnline. Public-profile reads derive online state from how
// recently lastSeen was touched — that way a tab closed without an
// explicit logout decays to "offline" within a couple of minutes
// instead of being stuck online in the DB forever.
//
// Mounted once in SocketBoundary. The interval + visibility listener
// are module-scoped (not effect-scoped) so even if SocketBoundary's
// subtree re-renders or React Strict Mode tears the effect down, we
// only ever have one timer + one listener in flight.
export function useHeartbeat() {
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) return undefined;

    // First mount: fire one ping, set up the interval + the visibility
    // listener. Re-mounts (Strict Mode, parent re-renders) are no-ops
    // because the singletons are already in place and ping() itself is
    // throttled to once per HEARTBEAT_MS.
    ping();
    if (intervalId == null) {
      intervalId = setInterval(ping, HEARTBEAT_MS);
    }
    if (!visibilityBound && typeof document !== "undefined") {
      visibilityBound = true;
      document.addEventListener("visibilitychange", ping);
    }

    // Deliberately no cleanup. The heartbeat is a session-long
    // singleton; tearing it down on every parent re-render is what
    // caused the "fires on every message send" bug — every send re-ran
    // the effect, which fired a fresh ping(). Clearing only happens on
    // logout via clearSession (token → null → effect early-return).
    return undefined;
  }, [token]);

  // When the token goes away (logout / forced sign-out), drop the
  // module singletons so we stop pinging until the next login.
  useEffect(() => {
    if (token) return undefined;
    if (intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (visibilityBound && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", ping);
      visibilityBound = false;
    }
    lastPingAt = 0;
    return undefined;
  }, [token]);
}
