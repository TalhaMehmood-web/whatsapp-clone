"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEditMessageMutation } from "@/tanstack/messages/mutations";
import { useUiStore } from "@/stores/ui-store";
import { COPY } from "@/config/constants";

// Modal editor that pops over the chat when the user picks Edit from the
// message context menu. Matches WhatsApp Web: dedicated dialog with the
// original text pre-filled, Save / Cancel actions, and Esc to dismiss.
export function EditMessageDialogHost() {
  // We pull every per-chat editing slot and surface whichever one is set.
  // Only one message can be edited at a time across the whole app, which
  // matches the WA Web behaviour.
  const editingByChat = useUiStore((s) => s.editingByChat);
  const setEditing = useUiStore((s) => s.setEditing);

  const open = Object.entries(editingByChat).find(([, msg]) => !!msg);
  const [chatId, message] = open ?? [null, null];

  return (
    <EditMessageDialog
      key={message?.id ?? "closed"}
      open={!!message}
      chatId={chatId}
      message={message}
      onClose={() => chatId && setEditing(chatId, null)}
    />
  );
}

function EditMessageDialog({ open, chatId, message, onClose }) {
  const edit = useEditMessageMutation(chatId);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(message?.content ?? "");
  }, [open, message?.id]);

  if (!message) return null;

  const onSave = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed === message.content) {
      onClose();
      return;
    }
    edit.mutate(
      { messageId: message.id, content: trimmed },
      {
        onSuccess: onClose,
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to edit"),
      },
    );
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{COPY.MSG_EDIT}</DialogTitle>
          <DialogDescription>{COPY.MSG_EDIT_PLACEHOLDER}</DialogDescription>
        </DialogHeader>

        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={4}
          className="block w-full resize-y rounded-md border border-wa-border bg-wa-panel-2 px-3 py-2 text-sm text-wa-text placeholder:text-wa-text-muted focus:outline-none focus:ring-2 focus:ring-wa-green"
        />

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={edit.isPending}
          >
            {COPY.CONFIRM_CANCEL}
          </Button>
          <Button
            type="button"
            onClick={onSave}
            loading={edit.isPending}
            disabled={!value.trim()}
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            {COPY.MSG_EDIT_SAVE}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
