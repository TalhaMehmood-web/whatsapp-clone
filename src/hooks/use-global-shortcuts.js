"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useUiStore } from "@/stores/ui-store";
import { useChatStore } from "@/stores/chat-store";
import {
  useArchiveChatMutation,
  useMarkChatUnreadMutation,
  useMuteChatMutation,
  usePinChatMutation,
} from "@/tanstack/chat/mutations";
import { queryKeys } from "@/config/query-keys";
import { ROUTES } from "@/config/constants";

// Global keyboard shortcuts. Mounted once at the (main) layout. Maps the
// chips in the Keyboard shortcuts dialog to real actions.
//
// Conventions:
//
// 1. We match against `event.code` for letters (which is layout-aware)
//    and `event.key` for non-letter symbols, so AZERTY / Dvorak users get
//    the same chord that's printed on the chip.
// 2. Shortcuts are suppressed while the user is typing into an input,
//    textarea, or contenteditable — except for Escape, which always
//    closes the active chat.
// 3. Per-chat shortcuts (pin/mute/archive/unread/label) need a current
//    chat. We resolve it from the URL via `usePathname` so the shortcut
//    works on /chat/[id] regardless of what's focused.
//
// Adding a shortcut here? Also update keyboard-shortcuts-data.js so the
// dialog reflects reality.
export function useGlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();

  const openKeyboardShortcuts = useUiStore((s) => s.openKeyboardShortcuts);
  const openNewChat = useUiStore((s) => s.openNewChat);
  const openNewGroup = useUiStore((s) => s.openNewGroup);
  const openManageLabels = useUiStore((s) => s.openManageLabels);
  const toggleChatSearch = useUiStore((s) => s.toggleChatSearch);
  const setListSearch = useChatStore((s) => s.setSearch);

  const pinChat = usePinChatMutation();
  const archiveChat = useArchiveChatMutation();
  const muteChat = useMuteChatMutation();
  const markUnread = useMarkChatUnreadMutation();

  useEffect(() => {
    const handler = (event) => {
      // Escape always wins: closes the active chat even from inside the
      // composer so the user can ditch a draft fast.
      if (event.key === "Escape") {
        if (isChatRoute(pathname)) {
          router.push(ROUTES.CHAT_INDEX);
          event.preventDefault();
        }
        return;
      }

      // Don't hijack key presses inside text inputs.
      if (isTyping(event.target)) return;

      const cmd = event.ctrlKey || event.metaKey;
      const code = event.code;
      const key = event.key;

      // `?` opens the shortcuts dialog. Matches WhatsApp's behaviour —
      // pressing Shift+/ on US layout while no input is focused.
      if (key === "?" && !cmd) {
        openKeyboardShortcuts();
        event.preventDefault();
        return;
      }

      // Pull the focused chat once — most per-chat shortcuts share this.
      const activeChatId = chatIdFromPath(pathname);

      // Ctrl+Shift+F is the one chord without Alt — search inside the
      // active chat. Handle it before the Alt-required gate below.
      if (cmd && event.shiftKey && !event.altKey && code === "KeyF") {
        if (activeChatId) toggleChatSearch(activeChatId);
        event.preventDefault();
        return;
      }

      if (!cmd || !event.altKey) return; // every other chord needs Ctrl+Alt

      // ── Ctrl+Alt+Shift+X ──────────────────────────────────────────
      if (event.shiftKey) {
        switch (code) {
          case "KeyU": // Mark as unread
            if (activeChatId) markUnread.mutate(activeChatId);
            event.preventDefault();
            return;
          case "KeyM": // Mute
            if (activeChatId) {
              // 8h default — same as WhatsApp's first-tier mute. The
              // chat-info sheet has finer-grained options.
              muteChat.mutate({
                chatId: activeChatId,
                value: true,
                durationMs: 1000 * 60 * 60 * 8,
              });
              toast.success("Chat muted for 8 hours");
            }
            event.preventDefault();
            return;
          case "KeyE": // Archive
            if (activeChatId)
              archiveChat.mutate({ chatId: activeChatId, value: true });
            event.preventDefault();
            return;
          case "KeyP": // Pin
            if (activeChatId)
              pinChat.mutate({ chatId: activeChatId, value: true });
            event.preventDefault();
            return;
          case "KeyN": // New group
            openNewGroup();
            event.preventDefault();
            return;
          case "KeyL": // Label chat
            openManageLabels();
            event.preventDefault();
            return;
          case "BracketRight": // Next chat
            stepChat(qc, router, pathname, +1);
            event.preventDefault();
            return;
          case "BracketLeft": // Previous chat
            stepChat(qc, router, pathname, -1);
            event.preventDefault();
            return;
          default:
            break;
        }
      } else {
        // ── Ctrl+Alt+X (no Shift) ───────────────────────────────────
        switch (code) {
          case "KeyN": // New chat
            openNewChat();
            event.preventDefault();
            return;
          case "KeyP": // Profile and About
            router.push(ROUTES.SETTINGS_PROFILE);
            event.preventDefault();
            return;
          case "Slash": // Search the chat list ("/")
          case "Backslash": // some keyboards send Backslash for `/`
            focusListSearch(setListSearch);
            event.preventDefault();
            return;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    router,
    pathname,
    qc,
    openKeyboardShortcuts,
    openNewChat,
    openNewGroup,
    openManageLabels,
    toggleChatSearch,
    setListSearch,
    pinChat,
    archiveChat,
    muteChat,
    markUnread,
  ]);
}

// True when the event target is a text-entry surface and we shouldn't
// steal the keypress.
function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

// Pulls the chat id out of `/chat/[id]`. Returns null on the index page.
function chatIdFromPath(pathname) {
  const m = /^\/chat\/([^/]+)/.exec(pathname ?? "");
  return m ? m[1] : null;
}

function isChatRoute(pathname) {
  return /^\/chat\/[^/]+/.test(pathname ?? "");
}

// Walks every cached chat-list query, flattens the entries, finds the
// current chat and routes to its neighbour. `step` is +1 (next) or -1
// (previous). Wraps around at either end so the shortcut never feels
// stuck.
function stepChat(qc, router, pathname, step) {
  const current = chatIdFromPath(pathname);
  // Pull every cached list under ["chats", "list", …] in insertion order.
  const lists = qc.getQueriesData({ queryKey: queryKeys.chats.all });
  for (const [, data] of lists) {
    if (!Array.isArray(data)) continue;
    const ids = data
      .map((entry) => entry?.chat?.id)
      .filter((id) => typeof id === "string");
    if (ids.length === 0) continue;
    const idx = current ? ids.indexOf(current) : -1;
    const next = idx === -1 ? 0 : (idx + step + ids.length) % ids.length;
    const targetId = ids[next];
    if (targetId) {
      router.push(ROUTES.CHAT_DETAIL(targetId));
      return;
    }
  }
}

// The list-search input is rendered inside the chat-list pane. We focus
// it via DOM lookup so the shortcut works whether the sidebar pane is
// visible or hidden behind a route change.
function focusListSearch(setListSearch) {
  const el = document.querySelector("[data-shortcut='chat-list-search']");
  if (el instanceof HTMLInputElement) {
    el.focus();
    el.select();
  } else {
    // Pane is hidden on small viewports — clear the filter so the user
    // sees every chat and can start typing on the focused list later.
    setListSearch("");
  }
}
