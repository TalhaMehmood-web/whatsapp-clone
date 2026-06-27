"use client";

import { Forward, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/utils/cn";
import { messageTime } from "@/utils/date-format";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/stores/ui-store";
import {
  MessageMetadataKind,
  MessageType,
  ReceiptStatus,
} from "@/models/enums";
import { COPY } from "@/config/constants";
import { MessageTick } from "./message-tick";
import { MediaPreview } from "./media-preview";
import { MessageContextMenu } from "./message-context-menu";
import { MessageReactions } from "./message-reactions";
import { QuotedReplyBlock } from "./message-reply-preview";
import { CallSystemBubble } from "./call-system-bubble";
import { CallLinkCard } from "./call-link-card";
import { StatusReplyHeader } from "./status-reply-bubble";

// Renders one chat message. Outgoing (sent by the current user) gets the
// green tint and the read-receipt tick; incoming gets the panel background.
// `showTail` controls whether to render the bubble's pointer tail (true for
// the first message in a sender-grouped run).
export function MessageBubble({ message, showTail = true, isGroup = false, onEdit }) {
  const { user } = useAuth();
  const isOutgoing = message.senderId === user?.id;
  // Avatar slot: only on incoming bubbles in group chats. The avatar
  // shows on the FIRST message in a sender-grouped run; subsequent
  // continuations render an invisible same-size spacer so the bubbles
  // stay flush-aligned (matches WhatsApp).
  const showAvatarSlot = isGroup && !isOutgoing;
  const showAvatar = showAvatarSlot && showTail;

  // SYSTEM messages render their own centred card and skip the bubble +
  // context menu chrome entirely. Today the only flavour is "call".
  if (
    message.type === MessageType.SYSTEM &&
    message.metadata?.kind === MessageMetadataKind.CALL
  ) {
    return <CallSystemBubble message={message} />;
  }

  // Optimistic rows show the clock-tick until the server returns the
  // real message and the cache replaces them.
  const receipt = isOutgoing
    ? message.__optimistic
      ? ReceiptStatus.PENDING
      : aggregateReceiptStatus(message.receipts, user?.id)
    : null;

  // The server only includes my own StarredMessage row when the message
  // is starred for me, so any entry here means show the star.
  const isStarred = (message.starredBy ?? []).length > 0;

  const isDeleted = !!message.deletedAt;
  const hasMedia = !!message.mediaUrl && !isDeleted;
  const text = isDeleted
    ? COPY.MSG_DELETED
    : message.content ?? message.caption ?? null;
  const isMediaWithoutText =
    hasMedia &&
    !text &&
    message.type !== MessageType.TEXT;

  // Anchor + highlight support for per-chat search.
  const searchQuery = useUiStore(
    (s) => s.chatSearchByChat[message.chatId]?.query ?? "",
  );

  // Multi-select mode: when any messages are selected in this chat, the
  // bubble shows a checkbox and clicks toggle selection instead of
  // opening the context menu.
  const selection = useUiStore((s) => s.selectionByChat[message.chatId]);
  const toggleSelection = useUiStore((s) => s.toggleMessageSelection);
  const selectionActive = !!selection && selection.size > 0;
  const isSelected = selectionActive && selection.has(message.id);

  return (
    <div
      id={`msg-${message.id}`}
      onClick={
        selectionActive
          ? (e) => {
              e.stopPropagation();
              toggleSelection(message.chatId, message.id);
            }
          : undefined
      }
      className={cn(
        "flex w-full cursor-default",
        selectionActive && "cursor-pointer hover:bg-wa-panel-2/30",
        isSelected && "bg-wa-green-soft/40",
      )}
    >
      {selectionActive && (
        <SelectionCheckbox
          checked={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            toggleSelection(message.chatId, message.id);
          }}
        />
      )}
      <div
        className={cn(
          "flex w-full px-3",
          isOutgoing ? "justify-end" : "justify-start",
        )}
      >
      {showAvatarSlot && (
        // Reserve the avatar's width even on continuation rows so the
        // bubble column stays flush-aligned across a sender's run.
        <div className="mr-2 mt-1 shrink-0 self-end">
          {showAvatar ? (
            <Avatar className="size-8">
              <AvatarImage
                src={message.sender?.avatar ?? undefined}
                alt={message.sender?.name ?? ""}
              />
              <AvatarFallback className="bg-wa-panel-3 text-[10px]">
                {(message.sender?.name ?? "??").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="size-8" aria-hidden="true" />
          )}
        </div>
      )}
      <div className={cn(
        "flex max-w-[65%] flex-col",
        isOutgoing ? "items-end" : "items-start",
      )}>
      <MessageContextMenu
        message={message}
        isOutgoing={isOutgoing}
        onEdit={onEdit}
      >
        <div
          className={cn(
            "relative rounded-lg text-sm shadow-sm",
            isOutgoing
              ? "bg-wa-green-2 text-wa-text"
              : "bg-wa-panel-3 text-wa-text",
            showTail && (isOutgoing ? "rounded-tr-none" : "rounded-tl-none"),
            isMediaWithoutText ? "p-1" : "px-2.5 py-1.5",
            isDeleted && "italic text-wa-text-muted",
            selectionActive && "pointer-events-none",
          )}
        >
          {!isDeleted && message.forwardedFrom && (
            <p className="mb-0.5 flex items-center gap-1 text-[11px] italic text-wa-text-muted">
              <Forward className="size-3" /> {COPY.MSG_FORWARDED}
            </p>
          )}
          {!isDeleted &&
            message.metadata?.kind === MessageMetadataKind.STATUS_REPLY && (
            <StatusReplyHeader message={message} isOutgoing={isOutgoing} />
          )}
          {!isDeleted && message.replyTo && (
            <QuotedReplyBlock
              reply={message.replyTo}
              isOutgoing={isOutgoing}
            />
          )}
          {hasMedia && (
            <MediaPreview
              message={message}
              className={text ? "mb-1.5" : undefined}
            />
          )}
          {!isDeleted && message.metadata?.kind === MessageMetadataKind.CALL_LINK ? (
            <CallLinkCard message={message} isOutgoing={isOutgoing} />
          ) : text ? (
            <p className="whitespace-pre-wrap wrap-break-word pr-14">
              <HighlightedText text={text} query={searchQuery} />
            </p>
          ) : null}
          <div
            className={cn(
              "float-right ml-2 mt-1 flex select-none items-center gap-1 text-[10px] text-wa-text-muted",
              isMediaWithoutText &&
                "absolute bottom-2 right-3 rounded bg-black/40 px-1.5 py-0.5 text-white",
            )}
          >
            {!isDeleted && message.editedAt && (
              <span className="italic">{COPY.MSG_EDITED}</span>
            )}
            {!isDeleted && isStarred && (
              <Star
                className={cn(
                  "size-3 fill-current",
                  isMediaWithoutText
                    ? "text-white"
                    : "text-wa-text-muted",
                )}
                aria-label="Starred"
              />
            )}
            {messageTime(message.createdAt)}
            {isOutgoing && !isDeleted && <MessageTick status={receipt} />}
          </div>
        </div>
      </MessageContextMenu>
      <MessageReactions
        message={message}
        align={isOutgoing ? "end" : "start"}
      />
      </div>
      </div>
    </div>
  );
}

// Round green checkbox shown on every message in selection mode (matches
// the WhatsApp Web "Select messages" treatment from the screenshot).
function SelectionCheckbox({ checked, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={checked ? "Deselect message" : "Select message"}
      aria-pressed={checked}
      className={cn(
        "ml-3 flex size-5 shrink-0 items-center justify-center self-center rounded border-2 transition-colors",
        checked
          ? "border-wa-green bg-wa-green text-white"
          : "border-wa-text-muted text-transparent hover:border-wa-text",
      )}
    >
      <svg viewBox="0 0 24 24" className="size-3" fill="none">
        <path
          d="M5 12.5 10 17 19 8"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function DaySeparator({ label }) {
  return (
    <div className="my-3 flex justify-center">
      <span className="rounded-md bg-wa-panel-2 px-3 py-1 text-[11px] text-wa-text-muted shadow-sm">
        {label}
      </span>
    </div>
  );
}

// Highlights every case-insensitive occurrence of `query` inside `text`.
// Used by the per-chat search bar (phase 15).
function HighlightedText({ text, query }) {
  if (!query) return <>{text}</>;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        className="rounded bg-wa-green-soft px-0.5 text-wa-green"
      >
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

// Picks the "worst" receipt across all non-sender recipients — that's what
// WhatsApp shows: a chat is fully read only once every recipient has read it.
function aggregateReceiptStatus(receipts, senderId) {
  if (!Array.isArray(receipts) || receipts.length === 0)
    return ReceiptStatus.SENT;
  const others = receipts.filter((r) => r.userId !== senderId);
  if (others.length === 0) return ReceiptStatus.SENT;
  if (others.every((r) => r.status === ReceiptStatus.READ))
    return ReceiptStatus.READ;
  if (others.every((r) => r.status !== ReceiptStatus.SENT))
    return ReceiptStatus.DELIVERED;
  return ReceiptStatus.SENT;
}
