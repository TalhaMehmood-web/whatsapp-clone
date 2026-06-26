"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useArchivedChatsQuery } from "@/tanstack/chat/queries";
import { ROUTES } from "@/config/constants";
import { ChatListItem } from "@/features/chat/chat-list/chat-list-item";

// Dedicated list pane that backs /archived. Mirrors WhatsApp Web's archived
// screen: header with a back-to-chats arrow + "Archived" title, list of
// archived chats below. No filter tabs or search — those live on the main
// chat list.
export function ArchivedList() {
  const { data, isLoading } = useArchivedChatsQuery();
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
        <h1 className="text-xl font-semibold text-wa-text">Archived</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-wa-text-muted">
            No archived chats.
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
