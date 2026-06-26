"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/utils/cn";
import { CHAT_TAB, CHAT_TAB_LABEL } from "@/config/constants";

const TABS = [CHAT_TAB.ALL, CHAT_TAB.UNREAD, CHAT_TAB.FAVOURITES, CHAT_TAB.GROUPS];

export function ChatFilterTabs() {
  const tab = useChatStore((s) => s.tab);
  const setTab = useChatStore((s) => s.setTab);

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-3 pb-3">
      {TABS.map((id) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-wa-green-soft text-wa-green"
                : "bg-wa-panel-2 text-wa-text-muted hover:bg-wa-panel-3",
            )}
          >
            {CHAT_TAB_LABEL[id]}
          </button>
        );
      })}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="More filters"
        className="ml-auto shrink-0 text-wa-text-muted hover:bg-wa-panel-2 hover:text-wa-text"
      >
        <ChevronDown className="size-4" />
      </Button>
    </div>
  );
}
