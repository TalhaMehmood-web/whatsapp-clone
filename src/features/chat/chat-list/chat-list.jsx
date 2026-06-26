"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { useChatsQuery } from "@/tanstack/chat/queries";
import { useChatStore } from "@/stores/chat-store";
import { CHAT_TAB } from "@/config/constants";

import { ChatListHeader } from "./chat-list-header";
import { ChatSearch } from "./chat-search";
import { ChatFilterTabs } from "./chat-filter-tabs";
import { ChatListItem } from "./chat-list-item";
import { ArchivedRow } from "./archived-row";
import { LockedChatsEntryRow } from "@/features/chat/locked-chats/locked-chats-entry-row";

// Virtualized chat list. Flattens "Pinned" + "All chats" into one row stream
// with inline section labels, then renders only the rows in view.
export function ChatList() {
  const tab = useChatStore((s) => s.tab);
  const search = useChatStore((s) => s.search);
  const debouncedSearch = useDebounced(search, 250);

  const filters = useMemo(
    () => ({
      tab,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [tab, debouncedSearch],
  );

  const { data, isLoading } = useChatsQuery(filters);

  const rows = useMemo(() => {
    const entries = data ?? [];
    const pinned = entries.filter((e) => e.membership?.isPinned);
    const recent = entries.filter((e) => !e.membership?.isPinned);

    const list = [];
    if (pinned.length > 0) list.push({ id: "label-pinned", kind: "label", text: "Pinned" });
    for (const entry of pinned)
      list.push({ id: `chat-${entry.chat.id}`, kind: "chat", entry });
    if (pinned.length > 0 && recent.length > 0)
      list.push({ id: "label-all", kind: "label", text: "All chats" });
    for (const entry of recent)
      list.push({ id: `chat-${entry.chat.id}`, kind: "chat", entry });
    return list;
  }, [data]);

  const scrollerRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollerRef.current,
    estimateSize: (i) => (rows[i].kind === "label" ? 28 : 72),
    overscan: 10,
    getItemKey: (i) => rows[i].id,
  });

  return (
    <div className="flex h-full flex-col">
      <ChatListHeader />
      <ChatSearch />
      <ChatFilterTabs />

      {tab === CHAT_TAB.ALL && !debouncedSearch && (
        <>
          <LockedChatsEntryRow />
          <ArchivedRow />
        </>
      )}

      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyHint tab={tab} search={debouncedSearch} />
        ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: "relative",
              width: "100%",
            }}
          >
            {virtualizer.getVirtualItems().map((vi) => {
              const row = rows[vi.index];
              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  {row.kind === "label" ? (
                    <SectionLabel>{row.text}</SectionLabel>
                  ) : (
                    <ChatListItem entry={row.entry} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-wa-text-muted">
      {children}
    </div>
  );
}

function EmptyHint({ tab, search }) {
  return (
    <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
      {search
        ? `No chats match "${search}".`
        : tab === CHAT_TAB.ALL
          ? "No chats yet. Start a new chat to get going."
          : `No chats in ${tab}.`}
    </p>
  );
}

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
