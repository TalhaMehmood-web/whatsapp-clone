"use client";

import { useState } from "react";
import { Folder, Images, Loader2, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCommunityQuery } from "@/tanstack/communities/queries";
import { CommunityMediaBrowser } from "@/features/communities/community-media-browser/community-media-browser";
import { ROUTES } from "@/config/constants";
import Link from "next/link";

export function CommunityDetail({ id }) {
  const { data: community, isLoading } = useCommunityQuery(id);
  const [browserOpen, setBrowserOpen] = useState(false);

  if (isLoading || !community) {
    return (
      <div className="flex h-full items-center justify-center bg-wa-bg text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-wa-bg">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-wa-border bg-wa-panel-2 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-10 rounded-lg">
            <AvatarImage src={community.photo ?? undefined} alt={community.name} />
            <AvatarFallback className="rounded-lg bg-wa-panel-3 text-xs">
              {community.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-wa-text">
              {community.name}
            </p>
            <p className="truncate text-[12px] text-wa-text-muted">
              {community.members.length} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-wa-text-muted">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Media"
            className="hover:text-wa-text"
            onClick={() => setBrowserOpen(true)}
          >
            <Images className="size-5" />
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
        {community.description && (
          <p className="px-6 py-4 text-sm text-wa-text-muted">
            {community.description}
          </p>
        )}

        <Separator />
        <div className="px-6 py-3 text-[11px] uppercase tracking-wider text-wa-text-muted">
          Groups
        </div>

        {community.chats.map((chat) => (
          <Link
            key={chat.id}
            href={ROUTES.CHAT_DETAIL(chat.id)}
            className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-wa-panel-2"
          >
            <Avatar className="size-10 rounded-md">
              <AvatarImage src={chat.photo ?? undefined} alt={chat.name} />
              <AvatarFallback className="rounded-md bg-wa-panel-3 text-[10px]">
                {(chat.name ?? "??").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm text-wa-text">{chat.name}</span>
            <Folder className="ml-auto size-4 text-wa-text-muted" />
          </Link>
        ))}
      </ScrollArea>

      <CommunityMediaBrowser
        open={browserOpen}
        onOpenChange={setBrowserOpen}
      />
    </div>
  );
}
