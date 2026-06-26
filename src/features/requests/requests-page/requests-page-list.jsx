"use client";

import { Loader2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useIncomingFriendRequestsQuery,
  useOutgoingFriendRequestsQuery,
} from "@/tanstack/friend-requests/queries";
import { COPY } from "@/config/constants";
import { UserResultRow } from "@/features/search/user-result-row/user-result-row";

// /requests list pane — Incoming + Sent tabs. Each row is a UserResultRow
// hard-pinned to the right relationship label so the action buttons render
// correctly.
export function RequestsPageList() {
  const incoming = useIncomingFriendRequestsQuery();
  const outgoing = useOutgoingFriendRequestsQuery();

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-wa-text">
          {COPY.REQUESTS_TITLE}
        </h1>
      </header>

      <Tabs defaultValue="incoming" className="flex flex-1 flex-col">
        <TabsList className="mx-auto mt-2">
          <TabsTrigger value="incoming">
            {COPY.REQUESTS_INCOMING}
            {incoming.data?.length ? ` (${incoming.data.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            {COPY.REQUESTS_OUTGOING}
            {outgoing.data?.length ? ` (${outgoing.data.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="m-0 flex-1">
          <ScrollArea className="h-full">
            <RequestList
              rows={incoming.data}
              isLoading={incoming.isLoading}
              empty={COPY.REQUESTS_EMPTY_INCOMING}
              kind="incoming"
            />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="outgoing" className="m-0 flex-1">
          <ScrollArea className="h-full">
            <RequestList
              rows={outgoing.data}
              isLoading={outgoing.isLoading}
              empty={COPY.REQUESTS_EMPTY_OUTGOING}
              kind="outgoing"
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestList({ rows, isLoading, empty, kind }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8 text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
        {empty}
      </p>
    );
  }
  return rows.map((req) => {
    const peer = kind === "incoming" ? req.from : req.to;
    return (
      <UserResultRow
        key={req.id}
        peer={{
          ...peer,
          relationship: kind === "incoming" ? "INCOMING" : "OUTGOING",
        }}
        incomingRequestId={kind === "incoming" ? req.id : undefined}
        outgoingRequestId={kind === "outgoing" ? req.id : undefined}
      />
    );
  });
}
