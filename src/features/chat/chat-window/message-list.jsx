"use client";

import { useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { useMessagesQuery } from "@/tanstack/messages/queries";
import { useChatQuery } from "@/tanstack/chat/queries";
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
  // Group vs 1:1 decides whether to show per-message sender avatars on
  // incoming bubbles. WhatsApp only shows them in groups — 1:1 has the
  // peer's avatar in the chat header already.
  const { data: chatData } = useChatQuery(chatId);
  const isGroup = !!chatData?.chat?.isGroup;
  const scrollerRef = useRef(null);
  const lastIdRef = useRef(null);
  // Tracks whether the initial landing-at-bottom has finished. We reset
  // it whenever the chat id changes so each new chat open re-runs the
  // settle loop (catches the dynamic-measurement case where bubbles
  // expand from their 56px estimate to their real height).
  const initialSettledRef = useRef(false);
  const setEditing = useUiStore((s) => s.setEditing);
  const onEdit = (message) => setEditing(chatId, message);

  // Reset bottom-tracking state on every chat switch so the next chat
  // doesn't inherit "we already landed" from the previous one.
  useEffect(() => {
    lastIdRef.current = null;
    initialSettledRef.current = false;
  }, [chatId]);

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

  // Auto-scroll to bottom. Two phases:
  //
  //  1. Initial open (`initialSettledRef.current === false`): the
  //     virtualizer's estimated row heights (56px) don't match the real
  //     measured heights (multiline text, media bubbles, etc.). A single
  //     scrollToIndex lands at an estimated position that scrolls back
  //     UP as rows measure their true height. WhatsApp's "always lands
  //     at the latest message" feel comes from pinning to the actual
  //     scrollHeight after each measurement pass. We re-pin via
  //     rAF for up to ~1 second, then stop.
  //
  //  2. Steady state (initial settled): only scroll when the newest
  //     message changes (new arrival or my own send). The existing
  //     lastIdRef guard handles that.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    const isNewMessage = lastIdRef.current !== last.id;
    if (!isNewMessage && initialSettledRef.current) return;
    lastIdRef.current = last.id;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    if (!initialSettledRef.current) {
      // Phase 1: pin to the real bottom across measurement passes.
      const start = Date.now();
      let raf = 0;
      const pin = () => {
        if (!scrollerRef.current) return;
        scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
        if (Date.now() - start < 1000) {
          raf = requestAnimationFrame(pin);
        } else {
          initialSettledRef.current = true;
        }
      };
      raf = requestAnimationFrame(pin);
      return () => cancelAnimationFrame(raf);
    }

    // Phase 2: a single scrollToIndex is fine — rows have measured
    // their real heights by now, the estimate-vs-real mismatch is gone.
    virtualizer.scrollToIndex(rows.length - 1, { align: "end" });
    return undefined;
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
                  isGroup={isGroup}
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
