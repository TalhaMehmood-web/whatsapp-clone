"use client";

import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSendMessageMutation } from "@/tanstack/messages/mutations";
import { useTypingEmitter } from "@/hooks/use-typing-indicator";
import { useUiStore } from "@/stores/ui-store";
import { COPY } from "@/config/constants";
import { MessageType } from "@/models/enums";

import { AttachMenu } from "./attach-menu";
import { VoiceRecorder } from "./voice-recorder";
import { EmojiPicker } from "./emoji-picker";
import { ReplyComposingBar } from "./message-reply-preview";

// Composer for new messages. Editing now lives in a dedicated dialog
// (EditMessageDialogHost mounted at the layout root) so this input only
// has to handle send-mode.
export function MessageInput({ chatId }) {
  const [value, setValue] = useState("");
  const { mutate: send, isPending: sending } = useSendMessageMutation(chatId);
  const notifyTyping = useTypingEmitter(chatId);
  const textareaRef = useRef(null);

  const reply = useUiStore((s) => s.replyByChat[chatId]);
  const setReply = useUiStore((s) => s.setReply);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    send({
      content: trimmed,
      type: MessageType.TEXT,
      replyToId: reply?.id,
    });
    setValue("");
    if (reply) setReply(chatId, null);
  };

  const onChange = (e) => {
    setValue(e.target.value);
    notifyTyping();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Insert an emoji at the current caret position so a tapped picker doesn't
  // wipe what the user already typed.
  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + emoji);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    queueMicrotask(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const hasText = value.trim().length > 0;

  return (
    <div className="flex flex-col">
      {reply && (
        <ReplyComposingBar
          message={reply}
          onCancel={() => setReply(chatId, null)}
        />
      )}
      <div className="flex items-end gap-2 border-t border-wa-border bg-wa-panel-2 px-3 py-2">
        <EmojiPicker onPick={insertEmoji} />
        <AttachMenu chatId={chatId} />

        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={COPY.TYPE_A_MESSAGE}
            className="block max-h-32 min-h-10 w-full resize-none rounded-lg border-0 bg-wa-panel px-3 py-2 text-sm text-wa-text placeholder:text-wa-text-muted focus:outline-none"
          />
        </div>

        {hasText ? (
          <Button
            size="icon"
            aria-label="Send"
            onClick={submit}
            loading={sending}
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            <SendHorizontal className="size-5" />
          </Button>
        ) : (
          <VoiceRecorder chatId={chatId} />
        )}
      </div>
    </div>
  );
}
