"use client";

import { useChatStore } from "@/stores/chat-store";
import { GlobalSearchPane } from "./global-search-pane";

// When the chat-list search input has a non-empty query, this overlay takes
// over the detail slot of the chat split-pane. Otherwise it renders the
// page's normal children (the active chat or the empty pane).
export function GlobalSearchHost({ children }) {
  const query = useChatStore((s) => s.search);
  const trimmed = query.trim();
  if (!trimmed) return children;
  return <GlobalSearchPane query={trimmed} />;
}
