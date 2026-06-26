"use client";

import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";

// Client-only host for the global keyboard shortcuts hook. Mounted at
// the (main) layout root. Renders nothing — the hook just attaches a
// window keydown listener for the lifetime of the authenticated app.
export function GlobalShortcutsBridge() {
  useGlobalShortcuts();
  return null;
}
