"use client";

import { Reply, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { previewText } from "@/utils/message-format";
import { COPY } from "@/config/constants";
import { cn } from "@/utils/cn";

// Inline strip rendered above the MessageInput when the user is composing
// a reply. Tap the X to cancel.
export function ReplyComposingBar({ message, onCancel }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-3 border-t border-wa-border bg-wa-panel-2 px-3 py-2">
      <Reply className="size-4 text-wa-green" />
      <div className="flex min-w-0 flex-1 flex-col rounded-md border-l-4 border-wa-green bg-wa-panel pl-3 pr-2 py-1">
        <span className="text-xs font-medium text-wa-green">
          {COPY.REPLY_TO}
        </span>
        <span className="truncate text-xs text-wa-text-muted">
          {previewText(message)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Cancel reply"
        onClick={onCancel}
        className="text-wa-text-muted hover:text-wa-text"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

// Quoted block rendered inside a message bubble when this message replies to
// another. Tappable later when we add scroll-to-message.
export function QuotedReplyBlock({ reply, isOutgoing }) {
  if (!reply) return null;
  return (
    <div
      className={cn(
        "mb-1 rounded-md border-l-4 px-2 py-1",
        isOutgoing
          ? "border-white/40 bg-black/15"
          : "border-wa-green bg-black/15",
      )}
    >
      <p className="text-[11px] font-medium text-wa-green">
        {reply.senderName ?? "Reply"}
      </p>
      <p className="truncate text-[12px] text-wa-text-muted">
        {previewText(reply)}
      </p>
    </div>
  );
}
