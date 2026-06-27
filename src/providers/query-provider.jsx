"use client";

import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

// App-version key for the persisted cache. Bumping this string busts
// every existing IndexedDB cache on the next page load — use it after
// any change that breaks the shape of a persisted query (renamed
// fields, new required props, etc.). The user gets one cold fetch on
// the version bump, then warm reloads forever after.
const CACHE_VERSION = "3";

// Which query keys are eligible for persistence. WhatsApp Web mirrors
// the conversation surfaces (chats, channels, status, calls) locally;
// transient stuff (search results, friend requests, notifications) is
// fetched fresh per session.
const PERSIST_PREFIXES = new Set([
  "messages",   // chat thread history
  "chats",      // chat list + per-chat detail + members + media catalog
  "channels",   // channels list + detail + posts + replies
  "status",     // status feed + per-author + viewers
  "communities",// communities list + detail
  "calls",      // call log so the /calls page warm-loads on reload
  "auth",       // me / session — cheap to keep so first render of any
                // protected route doesn't flash unauthenticated state
]);

function isPersistable(query) {
  const root = query.queryKey?.[0];
  return typeof root === "string" && PERSIST_PREFIXES.has(root);
}

// IndexedDB persister via idb-keyval — lighter than the full `idb`
// package and good enough for a single key/value pair. Localstorage
// would also work but caps at ~5MB; IndexedDB allows tens of MB.
const idbStorage = {
  getItem: (key) => get(key),
  setItem: (key, value) => set(key, value),
  removeItem: (key) => del(key),
};

const persister = createAsyncStoragePersister({
  storage: idbStorage,
  key: "wa-rq-cache",
  // Throttle disk writes — the cache changes constantly (every
  // keystroke in a typing indicator, every realtime patch). 1s of
  // batching keeps the IndexedDB transaction count sane without
  // losing more than 1s of state in a hard crash.
  throttleTime: 1000,
});

export function QueryProvider({ children }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            // Match WhatsApp Web: persisted queries should never get
            // evicted, because they ARE the local store. The default
            // 5-min gcTime defeats persistence — restored data would
            // be thrown out before the user reopens the chat. 24h is
            // a generous upper bound for any single browser session;
            // long-lived tabs effectively keep cache forever.
            gcTime: 1000 * 60 * 60 * 24,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        // Bump CACHE_VERSION above to force a one-time cold fetch
        // across every device after a breaking shape change.
        buster: CACHE_VERSION,
        // Persist forever — until busted or evicted by the browser.
        maxAge: Infinity,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" && isPersistable(query),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
