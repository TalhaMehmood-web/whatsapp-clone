"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { useChatPrefsQuery } from "@/tanstack/users/queries";
import { useUpdateChatPrefsMutation } from "@/tanstack/users/mutations";

// Bidirectional bridge between next-themes (the active session's
// `data-theme`-class on <html>) and the server-side `ChatPreferences.theme`
// enum. We need both because:
//
// - The Prisma enum is the canonical store across devices, so the user
//   logs in on a new browser and gets the same theme.
// - next-themes owns the live DOM state and respects "system" tracking.
//
// The bridge runs on the (main) layout (mounted once via a tiny client
// component) and:
//   1. On first hydration, reads `chatPrefs.theme` and pushes it into
//      next-themes so the DOM matches the server.
//   2. When the user picks a new theme via the ThemeRow, next-themes
//      flips the DOM immediately; we mirror the new value back to the
//      server via the chat-prefs mutation.
//
// We only mirror back AFTER the first sync to avoid an init-time round-
// trip storm. `lastServerValueRef` records what we last applied/saved so
// we don't re-PATCH a value the server already knows.
const ENUM_TO_THEME = { LIGHT: "light", DARK: "dark", SYSTEM: "system" };
const THEME_TO_ENUM = { light: "LIGHT", dark: "DARK", system: "SYSTEM" };
const selectTheme = (prefs) => prefs?.theme ?? null;

export function useThemeSync() {
  const { theme, setTheme } = useTheme();
  // Project to just `theme` so wallpaper / composer / quality changes
  // never wake up the theme bridge.
  const { data: serverTheme } = useChatPrefsQuery({ select: selectTheme });
  const update = useUpdateChatPrefsMutation();
  const lastServerValueRef = useRef(null);

  // Pull server → next-themes once on hydration (and any time the user
  // record gets refreshed from elsewhere, e.g. login on another tab).
  useEffect(() => {
    if (!serverTheme) return;
    const mapped = ENUM_TO_THEME[serverTheme] ?? "system";
    if (mapped !== lastServerValueRef.current) {
      lastServerValueRef.current = mapped;
      if (theme !== mapped) setTheme(mapped);
    }
  }, [serverTheme, theme, setTheme]);

  // Push next-themes → server when the user picks a new value via the
  // ThemeRow. Suppressed until we've seen the server's first value so
  // the initial hydration doesn't trigger an echo PATCH.
  useEffect(() => {
    if (!theme || !serverTheme) return;
    if (lastServerValueRef.current === null) return;
    if (theme === lastServerValueRef.current) return;
    const next = THEME_TO_ENUM[theme];
    if (!next || next === serverTheme) return;
    lastServerValueRef.current = theme;
    update.mutate({ theme: next });
    // update.mutate is stable; intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, serverTheme]);
}
