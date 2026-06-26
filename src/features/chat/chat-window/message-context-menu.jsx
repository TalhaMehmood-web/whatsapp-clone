"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Flag,
  Forward,
  Pencil,
  Pin,
  PinOff,
  Reply,
  Smile,
  Sparkles,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useDeleteMessageMutation,
  usePinMessageMutation,
  useReactToMessageMutation,
  useReportMessageMutation,
  useStarMessageMutation,
} from "@/tanstack/messages/mutations";
import { useChatQuery } from "@/tanstack/chat/queries";
import { useUiStore } from "@/stores/ui-store";
import { useAuth } from "@/hooks/use-auth";
import { COPY, QUICK_REACTIONS } from "@/config/constants";

// Right-click menu on a message bubble. Matches WhatsApp Web's order:
// quick-react strip on top, then Reply, Copy, React (full picker),
// Forward, Pin, Ask Meta AI, Star, Report, Delete.
//
// Pin + Report hit the new server endpoints; Ask Meta AI shows a
// "coming soon" toast since we don't ship an LLM in this clone.
export function MessageContextMenu({
  message,
  isOutgoing,
  onEdit,
  children,
}) {
  const { user } = useAuth();
  const setReply = useUiStore((s) => s.setReply);
  const openForward = useUiStore((s) => s.openForward);
  const startSelection = useUiStore((s) => s.startSelection);
  const [reportOpen, setReportOpen] = useState(false);

  const { data: chatData } = useChatQuery(message.chatId);
  const isPinned = (chatData?.chat?.pinnedMessageIds ?? []).includes(
    message.id,
  );

  const react = useReactToMessageMutation(message.chatId);
  const star = useStarMessageMutation(message.chatId);
  const pin = usePinMessageMutation(message.chatId);
  const report = useReportMessageMutation();
  const del = useDeleteMessageMutation(message.chatId);

  const isTombstone = !!message.deletedAt;

  const isStarred = (message.starredBy ?? []).some(
    (s) => s.userId === user?.id,
  );

  const copy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    toast.success("Copied");
  };

  const togglePin = () =>
    pin.mutate(
      { messageId: message.id, value: !isPinned },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to pin"),
      },
    );

  const onConfirmReport = () =>
    report.mutate(
      { messageId: message.id },
      {
        onSuccess: () => {
          setReportOpen(false);
          toast.success(COPY.MSG_REPORT_DONE);
        },
        onError: (err) => {
          setReportOpen(false);
          toast.error(err.response?.data?.error ?? "Failed to report");
        },
      },
    );

  // Tombstoned messages don't have any of the regular actions. The sender
  // gets a single Delete option that hard-purges the row from the DB and
  // every viewer's cache; everyone else gets no menu at all.
  if (isTombstone) {
    if (!isOutgoing) return <>{children}</>;
    const onPurge = () =>
      del.mutate(
        { messageId: message.id, mode: "purge" },
        {
          onError: (err) =>
            toast.error(err.response?.data?.error ?? "Failed to delete"),
        },
      );
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem
            className="text-wa-danger focus:text-wa-danger"
            onClick={onPurge}
            disabled={del.isPending}
          >
            <Trash2 className="mr-2 size-4" /> {COPY.MSG_DELETE}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <div className="flex items-center justify-between gap-1 px-1 py-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => react.mutate({ messageId: message.id, emoji })}
                className="text-lg leading-none transition-transform hover:scale-110"
                aria-label={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => setReply(message.chatId, message)}>
            <Reply className="mr-2 size-4" /> {COPY.MSG_REPLY}
          </ContextMenuItem>

          {message.content && (
            <ContextMenuItem onClick={copy}>
              <Copy className="mr-2 size-4" /> {COPY.MSG_COPY}
            </ContextMenuItem>
          )}

          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Smile className="mr-2 size-4" /> {COPY.MSG_REACT}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="grid grid-cols-6 gap-1 p-1">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() =>
                    react.mutate({ messageId: message.id, emoji })
                  }
                  className="text-lg leading-none transition-transform hover:scale-110"
                  aria-label={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem onClick={() => openForward(message)}>
            <Forward className="mr-2 size-4" /> {COPY.MSG_FORWARD}
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => startSelection(message.chatId, message.id)}
          >
            <Check className="mr-2 size-4" /> {COPY.CHAT_HDR_SELECT_MESSAGES}
          </ContextMenuItem>

          <ContextMenuItem onClick={togglePin} disabled={pin.isPending}>
            {isPinned ? (
              <>
                <PinOff className="mr-2 size-4" /> {COPY.MSG_UNPIN}
              </>
            ) : (
              <>
                <Pin className="mr-2 size-4" /> {COPY.MSG_PIN}
              </>
            )}
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => toast.info(COPY.MSG_ASK_META_AI_COMING)}
          >
            <Sparkles className="mr-2 size-4" /> {COPY.MSG_ASK_META_AI}
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() =>
              star.mutate({ messageId: message.id, value: !isStarred })
            }
          >
            {isStarred ? (
              <>
                <StarOff className="mr-2 size-4" /> {COPY.MSG_UNSTAR}
              </>
            ) : (
              <>
                <Star className="mr-2 size-4" /> {COPY.MSG_STAR}
              </>
            )}
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            onClick={() => setReportOpen(true)}
            className="text-wa-danger focus:text-wa-danger"
          >
            <Flag className="mr-2 size-4" /> {COPY.MSG_REPORT}
          </ContextMenuItem>

          {isOutgoing && onEdit && (
            <ContextMenuItem onClick={() => onEdit(message)}>
              <Pencil className="mr-2 size-4" /> {COPY.MSG_EDIT}
            </ContextMenuItem>
          )}

          {/* Delete just flips the chat into selection mode with this
              message pre-checked. The actual confirm dialog opens from
              the trash icon in the bottom selection bar, matching the
              WhatsApp Web flow. */}
          <ContextMenuItem
            className="text-wa-danger focus:text-wa-danger"
            onClick={() => startSelection(message.chatId, message.id)}
          >
            <Trash2 className="mr-2 size-4" /> {COPY.MSG_DELETE}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={reportOpen} onOpenChange={setReportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{COPY.MSG_REPORT_CONFIRM_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>
              {COPY.MSG_REPORT_CONFIRM_BODY}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{COPY.CONFIRM_CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmReport}
              className="bg-wa-danger text-white hover:bg-wa-danger/90"
            >
              {COPY.MSG_REPORT}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
