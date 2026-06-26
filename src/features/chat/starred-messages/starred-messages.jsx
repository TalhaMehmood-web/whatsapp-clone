"use client";

import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStarredMessagesQuery } from "@/tanstack/messages/queries";
import { chatListTime } from "@/utils/date-format";
import { previewText } from "@/utils/message-format";
import { COPY, ROUTES } from "@/config/constants";

export function StarredMessagesList() {
  const { data, isLoading } = useStarredMessagesQuery();
  const rows = data ?? [];

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center px-4">
        <h1 className="text-xl font-semibold text-wa-text">
          {COPY.STARRED_TITLE}
        </h1>
      </header>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-8 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
            {COPY.STARRED_EMPTY}
          </p>
        ) : (
          rows.map(({ message, chat, starredAt }) => {
            const name = chat.isGroup
              ? chat.name
              : message.sender?.name ?? "Unknown";
            const photo = chat.isGroup ? chat.photo : message.sender?.avatar;
            return (
              <Link
                key={message.id}
                href={ROUTES.CHAT_DETAIL(chat.id)}
                className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-wa-panel-2"
              >
                <Avatar className="size-10">
                  <AvatarImage src={photo ?? undefined} alt={name} />
                  <AvatarFallback className="bg-wa-panel-3 text-xs">
                    {(name ?? "??").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-wa-text">
                      {name}
                    </span>
                    <span className="shrink-0 text-[11px] text-wa-text-muted">
                      {chatListTime(starredAt)}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 truncate text-xs text-wa-text-muted">
                    <Star className="size-3 text-wa-green" />
                    {previewText(message)}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
