"use client";

import { useEffect, useState } from "react";
import { Pin, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useChatQuery } from "@/tanstack/chat/queries";
import { useMessagesQuery } from "@/tanstack/messages/queries";
import { usePinMessageMutation } from "@/tanstack/messages/mutations";
import { previewText } from "@/utils/message-format";
import { COPY } from "@/config/constants";

// Sticky banner above the message list showing the chat's pinned messages.
// Multiple pins are supported (cap of 3, enforced server-side); the banner
// shows one at a time and the user taps the strip to cycle to the next.
// X unpins the currently-shown pin.
export function PinnedMessageBanner({ chatId }) {
  const { data: chatData } = useChatQuery(chatId);
  const { data: messagesData } = useMessagesQuery(chatId);
  const unpin = usePinMessageMutation(chatId);

  const pinnedIds = chatData?.chat?.pinnedMessageIds ?? [];
  const [index, setIndex] = useState(0);

  // Clamp the cursor whenever the pin stack shrinks (we just unpinned).
  useEffect(() => {
    if (pinnedIds.length === 0) {
      if (index !== 0) setIndex(0);
      return;
    }
    if (index >= pinnedIds.length) setIndex(0);
  }, [pinnedIds.length, index]);

  if (pinnedIds.length === 0) return null;

  const currentId = pinnedIds[index] ?? pinnedIds[0];
  const pages = messagesData?.pages ?? [];
  const pinned = pages
    .flatMap((p) => p.messages ?? [])
    .find((m) => m.id === currentId);
  const preview = pinned?.deletedAt
    ? COPY.MSG_DELETED
    : previewText(pinned) ?? COPY.MSG_PINNED_LABEL;

  const onTap = () => {
    if (pinnedIds.length > 1) {
      setIndex((i) => (i + 1) % pinnedIds.length);
      return;
    }
    const el = document.getElementById(`msg-${currentId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onUnpin = (event) => {
    event.stopPropagation();
    unpin.mutate(
      { messageId: currentId, value: false },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to unpin"),
      },
    );
  };

  const label =
    pinnedIds.length > 1
      ? `${COPY.MSG_PINNED_LABEL} · ${index + 1}/${pinnedIds.length}`
      : COPY.MSG_PINNED_LABEL;

  return (
    <div className="flex w-full items-stretch border-b border-wa-border bg-wa-panel-2">
      {/* Coloured rail on the left, one segment per pin, to hint that the
          strip is cyclable when there's more than one. */}
      <div className="flex flex-col justify-stretch gap-0.5 py-2 pl-3">
        {pinnedIds.map((id, i) => (
          <span
            key={id}
            className={
              i === index
                ? "h-2 w-0.5 rounded-full bg-wa-green"
                : "h-2 w-0.5 rounded-full bg-wa-green/30"
            }
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onTap}
        className="flex flex-1 items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-wa-panel-3"
      >
        <Pin className="size-4 shrink-0 text-wa-green" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11px] uppercase tracking-wider text-wa-green">
            {label}
          </span>
          <span className="truncate text-xs text-wa-text-muted">{preview}</span>
        </div>
      </button>
      <div className="flex items-center pr-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={COPY.MSG_UNPIN}
          onClick={onUnpin}
          disabled={unpin.isPending}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
