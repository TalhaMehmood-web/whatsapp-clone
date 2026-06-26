"use client";

import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { previewText } from "@/utils/message-format";
import { COPY } from "@/config/constants";

// Strip rendered above the MessageInput when the user is editing a
// previous message. Matches the WhatsApp Web UX: pencil icon, a snippet
// of the original text, and an X to cancel.
export function EditComposingBar({ message, onCancel }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-3 border-t border-wa-border bg-wa-panel-2 px-3 py-2">
      <Pencil className="size-4 text-wa-green" />
      <div className="flex min-w-0 flex-1 flex-col rounded-md border-l-4 border-wa-green bg-wa-panel pl-3 pr-2 py-1">
        <span className="text-xs font-medium text-wa-green">
          {COPY.MSG_EDITING_LABEL}
        </span>
        <span className="truncate text-xs text-wa-text-muted">
          {previewText(message)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={COPY.MSG_EDIT_CANCEL}
        onClick={onCancel}
        className="text-wa-text-muted hover:text-wa-text"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
