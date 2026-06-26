"use client";

import { useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { useMessagesQuery } from "@/tanstack/messages/queries";
import { useUiStore } from "@/stores/ui-store";
import { daySeparator } from "@/utils/date-format";
import { DaySeparator, MessageBubble } from "./message-bubble";

// Virtualized message list. Builds a flat row model where each row is either
// a day separator or a message (so the virtualizer can size every row from
// a single source). Dynamic measurement covers the variance in bubble
// heights (text vs. media vs. multi-line).
export function MessageList({ chatId }) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useMessagesQuery(chatId);
  const scrollerRef = useRef(null);
  const lastIdRef = useRef(null);
  const setEditing = useUiStore((s) => s.setEditing);
  const onEdit = (message) => setEditing(chatId, message);

  // Flatten pages oldest→newest.
  const messages = useMemo(() => {
    if (!data?.pages) return [];
    return [...data.pages].reverse().flatMap((p) => p.messages);
  }, [data]);

  // Build the flat row model with interleaved day separators.
  const rows = useMemo(() => buildRows(messages), [messages]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollerRef.current,
    estimateSize: (i) => (rows[i].kind === "separator" ? 36 : 56),
    overscan: 8,
    getItemKey: (i) => rows[i].id,
  });

  // Auto-scroll to bottom whenever the newest message changes.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (lastIdRef.current === last.id) return;
    lastIdRef.current = last.id;
    virtualizer.scrollToIndex(rows.length - 1, { align: "end" });
  }, [messages, rows.length, virtualizer]);

  // Load older messages when the scroller is near the top.
  const onScroll = (e) => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (e.currentTarget.scrollTop < 60) fetchNextPage();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      className="h-full overflow-y-auto"
    >
      {isFetchingNextPage && (
        <div className="flex justify-center py-2 text-wa-text-muted">
          <Loader2 className="size-4 animate-spin" />
        </div>
      )}
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        }}
      >
        {items.map((vi) => {
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
                paddingBottom: 4,
              }}
            >
              {row.kind === "separator" ? (
                <DaySeparator label={row.label} />
              ) : (
                <MessageBubble
                  message={row.message}
                  showTail={row.showTail}
                  onEdit={onEdit}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Builds the [{ kind: 'separator' | 'message', ... }] row list.
function buildRows(messages) {
  const rows = [];
  let prevDay = null;
  let prevSenderId = null;
  for (const m of messages) {
    const day = new Date(m.createdAt).toDateString();
    if (day !== prevDay) {
      rows.push({
        id: `sep-${day}`,
        kind: "separator",
        label: daySeparator(m.createdAt),
      });
      prevDay = day;
      prevSenderId = null;
    }
    rows.push({
      id: m.id,
      kind: "message",
      message: m,
      showTail: prevSenderId !== m.senderId,
    });
    prevSenderId = m.senderId;
  }
  return rows;
}
