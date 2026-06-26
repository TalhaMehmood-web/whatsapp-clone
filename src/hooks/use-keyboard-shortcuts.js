"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { useUiStore } from "@/stores/ui-store";
import { useChatsQuery } from "@/tanstack/chat/queries";
import { ROUTES } from "@/config/constants";

// Global keyboard shortcuts. Mounted once at the (main) layout. Each branch
// is a small intent; the actual side effect uses the stores + router so we
// don't need to wire refs into every component.
//
// Avoid firing while the user is typing into an editable element so the
// shortcuts don't fight with normal text entry.
export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const setSearch = useChatStore((s) => s.setSearch);
  const openShortcuts = useUiStore((s) => s.openKeyboardShortcuts);
  const { data: chats } = useChatsQuery({ tab: useChatStore.getState().tab });

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        // Always-on: close the current chat.
        if (pathname?.startsWith(`${ROUTES.CHAT_INDEX}/`)) {
          router.replace(ROUTES.CHAT_INDEX);
        }
        return;
      }

      // Skip when typing in inputs / textareas / contenteditables.
      const t = e.target;
      const tag = t?.tagName?.toLowerCase();
      const editing =
        tag === "input" ||
        tag === "textarea" ||
        t?.isContentEditable;
      if (editing) return;

      // All combos are Ctrl + Alt (+ optional Shift) modifier.
      if (!e.ctrlKey || !e.altKey) return;

      const key = e.key.toLowerCase();

      // Ctrl+Alt+/  → focus search
      if (!e.shiftKey && key === "/") {
        e.preventDefault();
        // setSearch is a no-op write that nudges the input; focus is
        // ultimately the field's responsibility. Easier path: dispatch a
        // synthetic focus on the search input by id.
        const el = document.querySelector(
          'input[placeholder="Search or start a new chat"]',
        );
        el?.focus();
        return;
      }

      // Ctrl+Alt+N → new chat. Ctrl+Alt+Shift+N → new group.
      if (key === "n") {
        e.preventDefault();
        if (e.shiftKey) {
          // No store flag for "open new group"; phase 13 keeps this as a
          // soft-fail: route the user to /chat and let them open the menu.
          router.push(ROUTES.CHAT_INDEX);
        } else {
          router.push(ROUTES.CHAT_INDEX);
        }
        return;
      }

      // Ctrl+Alt+Shift+[ or ]  → previous / next chat in current list
      if (e.shiftKey && (key === "[" || key === "]")) {
        e.preventDefault();
        const list = (chats ?? []).map((c) => c.chat.id);
        const match = pathname?.match(/^\/chat\/(.+?)(?:\/|$)/);
        const currentId = match?.[1];
        if (list.length === 0) return;
        const idx = currentId ? list.indexOf(currentId) : -1;
        const nextIdx =
          key === "]"
            ? Math.min(list.length - 1, idx + 1)
            : Math.max(0, idx - 1);
        if (list[nextIdx]) router.push(ROUTES.CHAT_DETAIL(list[nextIdx]));
        return;
      }

      // Ctrl+Alt+Shift+? → open keyboard shortcuts dialog (extra convenience)
      if (e.shiftKey && key === "?") {
        e.preventDefault();
        openShortcuts();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, pathname, setSearch, openShortcuts, chats]);
}
