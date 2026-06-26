"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SendHorizontal, Sticker } from "lucide-react";
import { toast } from "sonner";

import api from "@/config/axios-instance";
import { Button } from "@/components/ui/button";
import { useStartChatMutation } from "@/tanstack/chat/mutations";
import { useAuthStore } from "@/stores/auth-store";
import { queryKeys } from "@/config/query-keys";
import { endpoints } from "@/config/endpoints";
import { COPY } from "@/config/constants";
import {
  MessageMetadataKind,
  MessageType,
  ReceiptStatus,
  StatusType,
} from "@/models/enums";
import { EmojiPicker } from "@/features/chat/chat-window/emoji-picker";

// Inline composer at the bottom of the status viewer. Hitting send opens
// (or fetches) the 1:1 chat with the status author and posts a message
// that references the status. We optimistically insert into the messages
// cache for the resolved chat and route into it — both sides see the
// message live thanks to the existing MESSAGE_NEW socket fan-out.
//
// `onSendingChange` lets the parent pause the auto-advance ticker while
// the user is composing — otherwise the story would skip mid-typing.
export function StatusReplyComposer({ authorId, status, onSendingChange }) {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const start = useStartChatMutation();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const onFocus = () => onSendingChange?.(true);
  const onBlur = () => {
    // Stay paused as long as the user still has something typed —
    // matches WhatsApp Web (you can blur to grab the emoji picker etc.
    // and the story stays still).
    if (!value) onSendingChange?.(false);
  };

  const onChange = (e) => {
    const next = e.target.value;
    setValue(next);
    // Typing keeps the story paused even if the input loses focus on
    // mobile soft-keyboards.
    if (next) onSendingChange?.(true);
  };

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    if (!el) {
      setValue((v) => v + emoji);
      return;
    }
    const startPos = el.selectionStart ?? value.length;
    const endPos = el.selectionEnd ?? value.length;
    const next = value.slice(0, startPos) + emoji + value.slice(endPos);
    setValue(next);
    queueMicrotask(() => {
      el.focus();
      const pos = startPos + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    if (!me?.id) {
      toast.error("Please sign in to reply.");
      return;
    }
    if (!authorId || authorId === me.id) {
      // Replying to one's own status doesn't make sense; the parent
      // viewer already hides the composer in that case, but guarding
      // here keeps the API from returning the unhelpful "Cannot start
      // a chat with yourself" 400.
      toast.error("You can't reply to your own status.");
      return;
    }
    setSending(true);
    try {
      // 1) Resolve the 1:1 chat with the status author.
      const chat = await start.mutateAsync(authorId);
      if (!chat?.id) {
        throw new Error("Could not open chat with this contact.");
      }
      const chatId = chat.id;

      // 2) The reply message body is just the user's text. The status
      // context lives on `metadata.statusReply` so the chat bubble can
      // render a dedicated card (matches WhatsApp's "You · Status" /
      // "<peer> · Status" treatment).
      const content = trimmed;
      const metadata = {
        kind: MessageMetadataKind.STATUS_REPLY,
        statusId: status.id,
        authorId,
        statusType: status.type,
        statusPreview:
          status.type === StatusType.TEXT
            ? truncate(status.content ?? "", 200)
            : status.caption ?? null,
        statusMediaUrl:
          status.type === StatusType.TEXT
            ? null
            : status.mediaUrl ?? null,
        statusBgColor: status.bgColor ?? null,
        statusCreatedAt: status.createdAt,
      };

      // 3) Optimistic insert into the message cache for the resolved chat.
      // Same shape useSendMessageMutation produces so MessageBubble
      // renders it (PENDING tick) and the socket-sync dedupe replaces it
      // when MESSAGE_NEW arrives.
      const tempId = `temp-${Date.now()}`;
      const key = queryKeys.messages.list(chatId);
      const optimistic = {
        id: tempId,
        chatId,
        senderId: me?.id,
        content,
        type: MessageType.TEXT,
        mediaUrl: null,
        mediaMime: null,
        mediaSizeBytes: null,
        mediaDuration: null,
        fileName: null,
        caption: null,
        replyToId: null,
        forwardedFrom: null,
        forwardCount: 0,
        editedAt: null,
        deletedAt: null,
        metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: me
          ? { id: me.id, name: me.name, avatar: me.avatar ?? null }
          : null,
        receipts: [{ userId: me?.id, status: ReceiptStatus.READ }],
        reactions: [],
        starredBy: [],
        replyTo: null,
        __optimistic: true,
      };
      qc.setQueryData(key, (old) => {
        if (!old) {
          return {
            pageParams: [null],
            pages: [{ messages: [optimistic], nextCursor: null }],
          };
        }
        return {
          ...old,
          pages: old.pages.map((p, i) =>
            i === 0 ? { ...p, messages: [...p.messages, optimistic] } : p,
          ),
        };
      });

      // 4) Fire the actual send. The server emits MESSAGE_NEW to both
      // the chat room and every member's user room — the recipient sees
      // the message live without refreshing. We stay on the status
      // viewer; the optimistic insert above means a small "Reply sent"
      // toast is enough confirmation here.
      try {
        await api.post(endpoints.chats.messages(chatId), {
          content,
          type: MessageType.TEXT,
          metadata,
        });
      } catch (err) {
        qc.setQueryData(key, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              messages: p.messages.filter((m) => m.id !== tempId),
            })),
          };
        });
        throw err;
      }

      setValue("");
      // Clear the input + resume the story (`paused → false`). The
      // viewer's auto-advance ticker restarts from where it left off.
      onSendingChange?.(false);
      // Drop the textarea focus so any soft-keyboard goes away too.
      inputRef.current?.blur();
      toast.success("Reply sent");
    } catch (err) {
      // Surface whatever the server (or runtime) actually said —
      // previously this only fell back to a generic toast, hiding
      // the real cause when the server returned a 4xx without the
      // `response.data.error` shape (eg. friend-gate, blocked, etc.).
      const detail =
        err?.response?.data?.error ?? err?.message ?? "Could not send reply";
      toast.error(detail);
      // Helpful for diagnosing user reports.
      // eslint-disable-next-line no-console
      console.error("status reply failed", err);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex w-full items-center gap-2 rounded-full bg-white/10 px-2 py-1.5 backdrop-blur">
      <EmojiPicker
        onPick={insertEmoji}
        className="text-white/80 hover:bg-white/10 hover:text-white"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Sticker"
        className="text-white/80 hover:bg-white/10 hover:text-white"
      >
        <Sticker className="size-5" />
      </Button>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={COPY.STATUS_REPLY_PLACEHOLDER}
        className="min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-white placeholder:text-white/60 focus:outline-none"
      />
      <Button
        type="button"
        size="icon"
        aria-label="Send reply"
        onClick={submit}
        loading={sending}
        disabled={!value.trim()}
        className="bg-wa-green text-white hover:bg-wa-green/90"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </div>
  );
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
