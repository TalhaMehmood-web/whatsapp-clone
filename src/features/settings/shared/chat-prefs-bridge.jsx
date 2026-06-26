"use client";

import { useThemeSync } from "@/hooks/use-theme-sync";

// Mounted once at the (main) layout root. Hosts the server-side
// chat-prefs sync hooks (theme today; more later as we wire enterIsSend,
// spellCheck and friends). The bridge renders nothing — its only job is
// to drive side-effects from the cached chat-prefs row.
export function ChatPrefsBridge() {
  useThemeSync();
  return null;
}
