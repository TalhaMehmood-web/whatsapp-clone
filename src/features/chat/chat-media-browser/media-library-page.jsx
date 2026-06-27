"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useChatQuery } from "@/tanstack/chat/queries";
import { COPY, ROUTES } from "@/config/constants";

import { ChatMediaTabs } from "./chat-media-tabs";

// Full-screen route renderer for `/chat/[id]/media`. Replaces the old
// right-side sheet so we stop nesting Sheets inside Sheets (which was
// causing the close-bubble bug). Layout:
//
//   ┌────────────────────────────────────────────┐
//   │  ← back   Media, links and docs            │  ← sticky header
//   ├────────────────────────────────────────────┤
//   │  [ Media | Docs | Links ]                  │  ← sticky tabs
//   │                                            │
//   │   grid / list                              │  ← scrolls
//   │                                            │
//   └────────────────────────────────────────────┘
//
// Back returns to /chat/[id]. On mobile this gives the full viewport
// to the library; on desktop it inherits the detail-pane width from
// the SplitPane shell so the chat list stays visible alongside.
export function MediaLibraryPage({ chatId }) {
  const router = useRouter();
  const { data: chat } = useChatQuery(chatId);
  const subtitle = chat?.chat?.isGroup
    ? chat?.chat?.name
    : chat?.peers?.[0]?.name;

  const goBack = () => {
    // router.back() is wrong when this route is the first landing
    // (deep link / refresh). Always route to the chat.
    router.push(ROUTES.CHAT_DETAIL(chatId));
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-wa-panel text-wa-text">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-wa-border bg-wa-panel-2 px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to chat"
          onClick={goBack}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-sm font-medium text-wa-text sm:text-base">
            {COPY.COMMUNITIES_MEDIA_TITLE}
          </h1>
          {subtitle && (
            <span className="truncate text-xs text-wa-text-muted">
              {subtitle}
            </span>
          )}
        </div>
      </header>

      <ChatMediaTabs chatId={chatId} />
    </div>
  );
}
