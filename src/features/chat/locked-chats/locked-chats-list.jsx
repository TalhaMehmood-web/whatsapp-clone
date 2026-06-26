"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useLockedChatsQuery } from "@/tanstack/chat/queries";
import { COPY, ROUTES } from "@/config/constants";
import { ChatListItem } from "@/features/chat/chat-list/chat-list-item";

// Dedicated locked-chats pane shown at /locked. Same shell as the
// archived screen: back arrow + title + list of rows reusing the
// existing ChatListItem (so context-menu, unlock, etc. still work).
export function LockedChatsList() {
  const { data, isLoading } = useLockedChatsQuery();
  const entries = data?.chats ?? [];

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center gap-3 px-2">
        <Link
          href={ROUTES.CHAT_INDEX}
          aria-label="Back to chats"
          className="grid size-9 place-items-center rounded-full text-wa-text-muted transition-colors hover:bg-wa-panel-2 hover:text-wa-text"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold text-wa-text">
          {COPY.LOCKED_CHATS_TITLE}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-wa-text-muted">
            {COPY.LOCKED_CHATS_EMPTY}
          </p>
        ) : (
          entries.map((entry) => (
            <ChatListItem key={entry.chat.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}
