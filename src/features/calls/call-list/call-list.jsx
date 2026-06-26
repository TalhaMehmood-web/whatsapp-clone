"use client";

import { Loader2, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCallLogQuery } from "@/tanstack/calls/queries";
import { COPY } from "@/config/constants";
import { CallLogItem } from "./call-log-item";

export function CallList() {
  const { data, isLoading } = useCallLogQuery();
  const entries = data ?? [];

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-wa-text">
          {COPY.CALLS_TITLE}
        </h1>
        <div className="flex items-center gap-1 text-wa-text-muted">
          <Button
            variant="ghost"
            size="icon"
            aria-label={COPY.CALLS_NEW}
            className="hover:text-wa-text"
          >
            <Plus className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="More"
            className="hover:text-wa-text"
          >
            <MoreVertical className="size-5" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-8 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
            {COPY.CALLS_EMPTY}
          </p>
        ) : (
          entries.map((entry) => (
            <CallLogItem key={entry.id} entry={entry} />
          ))
        )}
      </ScrollArea>
    </div>
  );
}
