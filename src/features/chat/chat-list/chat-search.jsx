"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/chat-store";
import { COPY } from "@/config/constants";

export function ChatSearch() {
  const search = useChatStore((s) => s.search);
  const setSearch = useChatStore((s) => s.setSearch);

  return (
    <div className="px-3 pb-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={COPY.SEARCH_PLACEHOLDER}
          // Hook target for the global Ctrl+Alt+/ shortcut. See
          // hooks/use-global-shortcuts.js — focusListSearch().
          data-shortcut="chat-list-search"
          className="h-9 rounded-full border-0 bg-wa-panel-2 pl-10 text-sm shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
