"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Forward, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  useDeleteMessageMutation,
  useStarMessageMutation,
} from "@/tanstack/messages/mutations";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { queryKeys } from "@/config/query-keys";
import { COPY } from "@/config/constants";

import { DeleteMessageDialog } from "./delete-message-dialog";

// Renders in place of the chat header while messages are selected. Three
// bulk actions:
//   Star    — toggles star on each selected message.
//   Forward — opens the forward modal targeting the most recently
//             selected message (multi-target forward is out of scope).
//   Delete  — opens the WhatsApp-style 3-option dialog. "Delete for
//             everyone" is only offered when EVERY selected row is mine.
export function SelectionBar({ chatId }) {
  const ids = useUiStore((s) => s.selectionByChat[chatId]);
  const clear = useUiStore((s) => s.clearSelection);
  const openForward = useUiStore((s) => s.openForward);
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);

  const star = useStarMessageMutation(chatId);
  const remove = useDeleteMessageMutation(chatId);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const count = ids?.size ?? 0;
  if (count === 0) return null;
  const idArray = [...ids];

  // Figure out which of the selected ids are mine by walking the cached
  // message pages. Anything we can't find (eg. stale id from a refetch)
  // is treated as not-mine to keep the "delete for everyone" gate safe.
  const cache = qc.getQueryData(queryKeys.messages.list(chatId));
  const allMine = idArray.every((id) => {
    if (!cache?.pages) return false;
    for (const p of cache.pages) {
      const found = p.messages?.find((m) => m.id === id);
      if (found) return found.senderId === me?.id;
    }
    return false;
  });

  const onStar = () => {
    for (const messageId of idArray) {
      star.mutate({ messageId, value: true });
    }
    toast.success(`Starred ${count}`);
    clear(chatId);
  };

  const onForward = () => {
    if (idArray.length === 0) return;
    openForward({ id: idArray[idArray.length - 1] });
    clear(chatId);
  };

  const bulkDelete = (mode) => {
    for (const messageId of idArray) {
      remove.mutate(
        { messageId, mode },
        {
          onError: (err) =>
            toast.error(err.response?.data?.error ?? "Failed to delete"),
        },
      );
    }
    setDeleteOpen(false);
    clear(chatId);
  };

  return (
    <footer className="flex h-14 shrink-0 items-center justify-between gap-3 border-t border-wa-border bg-wa-panel-2 px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label={COPY.SELECT_CANCEL}
          onClick={() => clear(chatId)}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <X className="size-5" />
        </Button>
        <span className="text-sm text-wa-text">{COPY.SELECT_COUNT(count)}</span>
      </div>
      <div className="flex items-center gap-1 text-wa-text-muted">
        <Button
          variant="ghost"
          size="icon"
          aria-label={COPY.SELECT_STAR}
          onClick={onStar}
          className="hover:text-wa-text"
        >
          <Star className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={COPY.SELECT_FORWARD}
          onClick={onForward}
          className="hover:text-wa-text"
        >
          <Forward className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={COPY.SELECT_DELETE}
          onClick={() => setDeleteOpen(true)}
          className="text-wa-danger hover:text-wa-danger"
        >
          <Trash2 className="size-5" />
        </Button>
      </div>

      <DeleteMessageDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        count={count}
        canDeleteForEveryone={allMine}
        onDeleteForEveryone={() => bulkDelete("everyone")}
        onDeleteForMe={() => bulkDelete("me")}
      />
    </footer>
  );
}
