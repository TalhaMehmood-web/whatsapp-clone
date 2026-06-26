"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchUsersQuery } from "@/tanstack/users/queries";
import { COPY } from "@/config/constants";
import { UserResultRow } from "@/features/search/user-result-row/user-result-row";

// Dedicated /search page driven by useSearchUsersQuery (which now annotates
// each row with a friend-request relationship label).
export function SearchPageList() {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 250);
  const { data, isFetching } = useSearchUsersQuery(debounced);
  const results = data ?? [];

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-wa-text">
          {COPY.SEARCH_PAGE_TITLE}
        </h1>
      </header>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={COPY.SEARCH_PAGE_PLACEHOLDER}
            className="h-10 rounded-full border-0 bg-wa-panel-2 pl-10 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
        <p className="px-2 pt-2 text-xs text-wa-text-muted">
          {COPY.SEARCH_PAGE_SUBTITLE}
        </p>
      </div>

      <ScrollArea className="flex-1">
        {!debounced ? (
          <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
            {COPY.SEARCH_PAGE_EMPTY}
          </p>
        ) : isFetching ? (
          <div className="flex justify-center py-6 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
            {COPY.SEARCH_PAGE_NO_RESULTS}
          </p>
        ) : (
          results.map((peer) => (
            <UserResultRow key={peer.id} peer={peer} />
          ))
        )}
      </ScrollArea>
    </div>
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
