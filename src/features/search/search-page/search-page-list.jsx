"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchUsersQuery } from "@/tanstack/users/queries";
import { useMessageSearchQuery } from "@/tanstack/search/queries";
import { COPY } from "@/config/constants";
import { UserResultRow } from "@/features/search/user-result-row/user-result-row";

import { MessageResultRow } from "./message-result-row";

// /search page. Two tabs:
//
//   People   — legacy debounced contact search (server-side, 250ms).
//              Kept as-is because it predates the C11 audit and is
//              a small/cheap query.
//
//   Messages — new global cross-chat message search. Press-enter ONLY
//              per the C11 audit policy. The submitted query becomes
//              the React Query cache key; no on-change network calls.
//
// The default tab is People to preserve the existing landing UX.
export function SearchPageList() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-wa-text">
          {COPY.SEARCH_TITLE}
        </h1>
      </header>

      <Tabs defaultValue="people" className="flex min-h-0 flex-1 flex-col">
        <div className="px-3 pb-2">
          <TabsList className="grid w-full grid-cols-2 bg-transparent">
            <TabsTrigger value="people">{COPY.SEARCH_TAB_CONTACTS}</TabsTrigger>
            <TabsTrigger value="messages">
              {COPY.SEARCH_TAB_MESSAGES}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="people" className="mt-0 flex min-h-0 flex-1 flex-col">
          <PeopleTab />
        </TabsContent>

        <TabsContent value="messages" className="mt-0 flex min-h-0 flex-1 flex-col">
          <MessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// People — debounced contact search. Untouched legacy behaviour.
function PeopleTab() {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 250);
  const { data, isFetching } = useSearchUsersQuery(debounced);
  const results = data ?? [];

  return (
    <>
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
          results.map((peer) => <UserResultRow key={peer.id} peer={peer} />)
        )}
      </ScrollArea>
    </>
  );
}

// Messages — press-enter only. Two state slots:
//
//   draft       — what's in the input box right now (uncontrolled by
//                 react query; just local state).
//   submitted   — what was committed by Enter / the Search button.
//                 Drives the React Query cache key. Empty until the
//                 user submits, which keeps the query disabled.
function MessagesTab() {
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data, isFetching } = useMessageSearchQuery(submitted);
  const results = data?.results ?? [];

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSubmitted(trimmed);
  };

  const onClear = () => {
    setDraft("");
    setSubmitted("");
  };

  return (
    <>
      <form onSubmit={onSubmit} className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={COPY.SEARCH_MESSAGES_PLACEHOLDER}
            className="h-10 rounded-full border-0 bg-wa-panel-2 pl-10 pr-10 text-sm shadow-none focus-visible:ring-0"
          />
          {submitted && (
            <button
              type="button"
              onClick={onClear}
              aria-label={COPY.SEARCH_MESSAGES_CLEAR}
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-wa-text-muted hover:bg-wa-panel-3 hover:text-wa-text"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {submitted && (
          <p className="px-2 pt-2 text-xs text-wa-text-muted">
            Results for "{submitted}"
          </p>
        )}
      </form>

      <ScrollArea className="flex-1">
        {!submitted ? (
          <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
            {COPY.SEARCH_MESSAGES_PRESS_ENTER}
          </p>
        ) : isFetching ? (
          <div className="flex justify-center py-6 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
            {COPY.SEARCH_MESSAGES_NO_RESULTS}
          </p>
        ) : (
          <ul className="flex flex-col">
            {results.map((r) => (
              <MessageResultRow key={r.message.id} result={r} query={submitted} />
            ))}
          </ul>
        )}
      </ScrollArea>
    </>
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
