"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/stores/ui-store";
import { useChatSearchQuery } from "@/tanstack/search/queries";
import { COPY } from "@/config/constants";

const SCROLL_PREFIX = "msg-";

// Inline search bar shown directly under the chat header. Steps through
// matches by id — message rows in the list set `id={`msg-${id}`}` so we can
// scroll them into view without coupling to the virtualizer's indices.
export function ChatSearchBar({ chatId }) {
  const state = useUiStore((s) => s.chatSearchByChat[chatId]);
  const setQuery = useUiStore((s) => s.setChatSearchQuery);
  const close = useUiStore((s) => s.closeChatSearch);

  const query = state?.query ?? "";
  const debounced = useDebounced(query, 200);
  const { data, isFetching } = useChatSearchQuery(chatId, debounced);
  const matches = data ?? [];
  const [cursor, setCursor] = useState(0);

  // Reset cursor whenever the result set changes.
  useEffect(() => {
    setCursor(0);
    if (matches.length > 0) scrollTo(matches[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, matches.length]);

  if (!state?.open) return null;

  const goNext = () => {
    if (matches.length === 0) return;
    const next = (cursor + 1) % matches.length;
    setCursor(next);
    scrollTo(matches[next].id);
  };
  const goPrev = () => {
    if (matches.length === 0) return;
    const next = (cursor - 1 + matches.length) % matches.length;
    setCursor(next);
    scrollTo(matches[next].id);
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-wa-border bg-wa-panel-2 px-3">
      <Search className="size-4 text-wa-text-muted" />
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(chatId, e.target.value)}
        placeholder={COPY.SEARCH_IN_CHAT_PLACEHOLDER}
        className="h-8 flex-1 border-0 bg-wa-panel text-sm"
      />
      {isFetching ? (
        <Loader2 className="size-4 animate-spin text-wa-text-muted" />
      ) : query ? (
        <span className="text-xs text-wa-text-muted">
          {matches.length === 0
            ? "0/0"
            : `${cursor + 1}/${matches.length}`}
        </span>
      ) : null}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={COPY.SEARCH_PREV}
        onClick={goPrev}
        disabled={matches.length === 0}
        className="text-wa-text-muted hover:text-wa-text"
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={COPY.SEARCH_NEXT}
        onClick={goNext}
        disabled={matches.length === 0}
        className="text-wa-text-muted hover:text-wa-text"
      >
        <ChevronDown className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={COPY.SEARCH_CLOSE}
        onClick={() => close(chatId)}
        className="text-wa-text-muted hover:text-wa-text"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

function scrollTo(messageId) {
  const el = document.getElementById(`${SCROLL_PREFIX}${messageId}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
