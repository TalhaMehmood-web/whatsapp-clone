"use client";

import { useState } from "react";
import { Loader2, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommunitiesQuery } from "@/tanstack/communities/queries";
import { COPY } from "@/config/constants";
import { CommunityCard } from "./community-card";
import { NewCommunityModal } from "@/features/communities/new-community/new-community-modal";

export function CommunityList() {
  const { data, isLoading } = useCommunitiesQuery();
  const entries = data ?? [];
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-wa-text">
          {COPY.COMMUNITIES_TITLE}
        </h1>
        <div className="flex items-center gap-1 text-wa-text-muted">
          <Button
            variant="ghost"
            size="icon"
            aria-label={COPY.COMMUNITIES_NEW}
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
        ) : entries.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
            {COPY.COMMUNITIES_EMPTY}
          </p>
        ) : (
          entries.map((e) => (
            <CommunityCard key={e.community.id} entry={e} />
          ))
        )}
        <p className="px-6 pb-6 pt-4 text-center text-[11px] text-wa-text-muted">
          {COPY.COMMUNITIES_FOOTER}
        </p>
      </ScrollArea>

      <NewCommunityModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
