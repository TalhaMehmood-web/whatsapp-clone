"use client";

import { useState } from "react";
import { Loader2, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChannelsQuery } from "@/tanstack/channels/queries";
import { COPY } from "@/config/constants";
import { ChannelRow } from "./channel-row";
import { NewChannelModal } from "@/features/channels/new-channel/new-channel-modal";

export function ChannelList() {
  const { data, isLoading } = useChannelsQuery();
  const subscribed = data?.subscribed ?? [];
  const suggested = data?.suggested ?? [];
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-wa-text">
          {COPY.CHANNELS_TITLE}
        </h1>
        <div className="flex items-center gap-1 text-wa-text-muted">
          <Button
            variant="ghost"
            size="icon"
            aria-label={COPY.CHANNELS_NEW}
            className="hover:text-wa-text"
            onClick={() => setCreateOpen(true)}
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
        ) : (
          <>
            {subscribed.length > 0 && (
              <>
                <SectionLabel>{COPY.CHANNELS_MY}</SectionLabel>
                {subscribed.map((c) => (
                  <ChannelRow key={c.id} channel={c} />
                ))}
              </>
            )}
            {suggested.length > 0 && (
              <>
                <SectionLabel>{COPY.CHANNELS_DISCOVER}</SectionLabel>
                {suggested.map((c) => (
                  <ChannelRow key={c.id} channel={c} />
                ))}
              </>
            )}
            {subscribed.length === 0 && suggested.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
                {COPY.CHANNELS_EMPTY}
              </p>
            )}
          </>
        )}
      </ScrollArea>

      <NewChannelModal open={createOpen} onOpenChange={setCreateOpen} />
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
