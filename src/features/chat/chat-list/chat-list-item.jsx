"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  BellOff,
  Camera,
  CheckCheck,
  ChevronDown,
  FileText,
  Heart,
  HeartOff,
  Lock,
  MailOpen,
  Mic,
  Pin,
  PinOff,
  Bell,
  Trash2,
  UserX,
  Video,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { MessageType } from "@/models/enums";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";
import { chatListTime } from "@/utils/date-format";
import { previewText } from "@/utils/message-format";
import {
  useArchiveChatMutation,
  useClearChatMutation,
  useDeleteChatMutation,
  useFavouriteChatMutation,
  useMarkChatUnreadMutation,
  useMuteChatMutation,
  usePinChatMutation,
} from "@/tanstack/chat/mutations";
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
import { useRouter } from "next/navigation";
import { LockChatDialog } from "@/features/chat/locked-chats/lock-chat-dialog";
import { useAuth } from "@/hooks/use-auth";
import { COPY, DURATION, ROUTES } from "@/config/constants";
import { useUiStore } from "@/stores/ui-store";
import { ChatLabelSubmenu } from "@/features/chat/labels/chat-label-menu";
import { useLabelsQuery } from "@/tanstack/labels/queries";
import {
  useBlockedUsersQuery,
} from "@/tanstack/users/queries";
import {
  useBlockUserMutation,
  useUnblockUserMutation,
} from "@/tanstack/users/mutations";

export function ChatListItem({ entry }) {
  const { chat, membership, lastMessage, peers, labelIds = [] } = entry;
  const params = useParams();
  const { user } = useAuth();
  const active = params?.id === chat.id;
  const openLabels = useUiStore((s) => s.openManageLabels);
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = chat.isGroup ? chat.name : peers[0]?.name ?? "Unknown";
  const photo = chat.isGroup ? chat.photo : peers[0]?.avatar;
  const initials = (displayName ?? "??").slice(0, 2).toUpperCase();
  const isMuted = membership?.mutedUntil
    ? new Date(membership.mutedUntil) > new Date()
    : false;
  const isOutgoing = lastMessage?.senderId === user?.id;

  const router = useRouter();
  const pin = usePinChatMutation();
  const fav = useFavouriteChatMutation();
  const archive = useArchiveChatMutation();
  const mute = useMuteChatMutation();
  const markUnread = useMarkChatUnreadMutation();
  const clearChat = useClearChatMutation();
  const deleteChat = useDeleteChatMutation();
  const block = useBlockUserMutation();
  const unblock = useUnblockUserMutation();
  const [confirm, setConfirm] = useState(null); // null | "clear" | "delete"
  const [lockOpen, setLockOpen] = useState(false);
  const { data: allLabels } = useLabelsQuery();
  const { data: blocked } = useBlockedUsersQuery();
  const assigned = (allLabels ?? []).filter((l) => labelIds.includes(l.id));

  const peer = chat.isGroup ? null : peers[0] ?? null;
  const isBlocked = peer && (blocked ?? []).some((b) => b.id === peer.id);

  const notImplemented = (label) =>
    toast.info(`${label} is not implemented yet`);

  // Archive flips + a snackbar with Undo, matching WhatsApp Web. We patch
  // the cache first via the mutation's onMutate so the UI moves the row
  // immediately; the toast lets the user revert that exact toggle.
  const onToggleArchive = () => {
    const willArchive = !membership?.isArchived;
    archive.mutate(
      { chatId: chat.id, value: willArchive },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to update chat"),
      },
    );
    toast(willArchive ? "Chat archived" : "Chat unarchived", {
      action: {
        label: "Undo",
        onClick: () =>
          archive.mutate({ chatId: chat.id, value: !willArchive }),
      },
    });
  };

  const onMarkUnread = () =>
    markUnread.mutate(chat.id, {
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to mark unread"),
    });

  const onConfirmClear = () =>
    clearChat.mutate(chat.id, {
      onSuccess: () => {
        setConfirm(null);
        toast("Chat cleared");
      },
      onError: (err) => {
        setConfirm(null);
        toast.error(err.response?.data?.error ?? "Failed to clear chat");
      },
    });

  const onConfirmDelete = () =>
    deleteChat.mutate(chat.id, {
      onSuccess: () => {
        setConfirm(null);
        if (active) router.replace(ROUTES.CHAT_INDEX);
        toast(chat.isGroup ? "You left the group" : "Chat deleted");
      },
      onError: (err) => {
        setConfirm(null);
        toast.error(err.response?.data?.error ?? "Failed to delete chat");
      },
    });

  const toggleBlock = () => {
    if (!peer) return;
    if (isBlocked) {
      unblock.mutate(peer.id, {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to unblock"),
      });
    } else {
      block.mutate(peer, {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to block"),
      });
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-stretch gap-3 px-3 transition-colors hover:bg-wa-panel-2",
        active && "bg-wa-panel-3",
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
    >
      <Link
        href={ROUTES.CHAT_DETAIL(chat.id)}
        aria-label={`Open chat with ${displayName}`}
        className="absolute inset-0 z-10"
      />

      <div className="pointer-events-none flex shrink-0 items-center py-3">
        <Avatar className="size-12">
          <AvatarImage src={photo ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-wa-panel-3 text-sm text-wa-text">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="pointer-events-none flex min-w-0 flex-1 flex-col justify-center border-b border-wa-border py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[15px] font-normal text-wa-text">
            {displayName}
          </span>
          <span
            className={cn(
              "shrink-0 text-[12px] transition-opacity",
              membership?.unreadCount > 0
                ? "text-wa-green"
                : "text-wa-text-muted",
              // Hide the timestamp slot when the chevron is showing so we
              // don't double up.
              "group-hover:opacity-0",
              menuOpen && "opacity-0",
            )}
          >
            {lastMessage
              ? chatListTime(lastMessage.createdAt)
              : chatListTime(chat.updatedAt)}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 truncate text-[13px] text-wa-text-muted">
            {isOutgoing && lastMessage && (
              <CheckCheck className="size-3.5 shrink-0 text-wa-read-blue" />
            )}
            <MediaIcon type={lastMessage?.type} />
            <span className="truncate">{previewText(lastMessage)}</span>
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {isMuted && <BellOff className="size-3.5 text-wa-text-muted" />}
            {membership?.isPinned && (
              <Pin className="size-3.5 text-wa-text-muted" />
            )}
            {membership?.unreadCount > 0 && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-wa-green px-1 text-[11px] font-medium text-white">
                {membership.unreadCount}
              </span>
            )}
          </div>
        </div>

        {assigned.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {assigned.map((l) => (
              <span
                key={l.id}
                className="rounded-sm px-1.5 py-0.5 text-[10px] font-medium text-white"
                style={{ background: l.color }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover-only chevron that opens the row's dropdown menu. Sits above the
          invisible <Link> via z-index so clicks hit it, not the link. */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Chat options"
            className={cn(
              "absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-wa-panel-2/80 text-wa-text-muted opacity-0 transition-opacity hover:bg-wa-panel-3 hover:text-wa-text group-hover:opacity-100 focus-visible:opacity-100",
              menuOpen && "opacity-100",
            )}
          >
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onToggleArchive}>
            {membership?.isArchived ? (
              <>
                <ArchiveRestore className="mr-2 size-4" /> {COPY.UNARCHIVE}
              </>
            ) : (
              <>
                <Archive className="mr-2 size-4" /> {COPY.ARCHIVE}
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setLockOpen(true)}>
            <Lock className="mr-2 size-4" />
            {membership?.isLocked ? COPY.UNLOCK_CHAT : COPY.LOCK_CHAT}
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {isMuted ? (
                <Bell className="mr-2 size-4" />
              ) : (
                <BellOff className="mr-2 size-4" />
              )}
              {isMuted ? COPY.UNMUTE : COPY.CHAT_ITEM_MUTE_NOTIFICATIONS}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              {isMuted ? (
                <DropdownMenuItem
                  onClick={() =>
                    mute.mutate({ chatId: chat.id, value: false })
                  }
                >
                  {COPY.UNMUTE}
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      mute.mutate({
                        chatId: chat.id,
                        value: true,
                        durationMs: DURATION.MUTE_8H,
                      })
                    }
                  >
                    8 hours
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      mute.mutate({
                        chatId: chat.id,
                        value: true,
                        durationMs: DURATION.MUTE_1W,
                      })
                    }
                  >
                    1 week
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      mute.mutate({
                        chatId: chat.id,
                        value: true,
                        durationMs: DURATION.MUTE_ALWAYS,
                      })
                    }
                  >
                    Always
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            onClick={() =>
              pin.mutate({ chatId: chat.id, value: !membership?.isPinned })
            }
          >
            {membership?.isPinned ? (
              <>
                <PinOff className="mr-2 size-4" /> {COPY.UNPIN_CHAT}
              </>
            ) : (
              <>
                <Pin className="mr-2 size-4" /> {COPY.PIN_CHAT}
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onMarkUnread}>
            <MailOpen className="mr-2 size-4" /> {COPY.CHAT_ITEM_MARK_UNREAD}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              fav.mutate({ chatId: chat.id, value: !membership?.isFavourite })
            }
          >
            {membership?.isFavourite ? (
              <>
                <HeartOff className="mr-2 size-4" />{" "}
                {COPY.REMOVE_FROM_FAVOURITES}
              </>
            ) : (
              <>
                <Heart className="mr-2 size-4" /> {COPY.ADD_TO_FAVOURITES}
              </>
            )}
          </DropdownMenuItem>

          <ChatLabelSubmenu
            chatId={chat.id}
            assignedIds={labelIds}
            onManage={openLabels}
            triggerLabel={COPY.CHAT_ITEM_ADD_TO_LIST}
          />

          <DropdownMenuSeparator />

          {peer && (
            <DropdownMenuItem onClick={toggleBlock} disabled={block.isPending || unblock.isPending}>
              <UserX className="mr-2 size-4" />
              {isBlocked ? COPY.UNBLOCK : COPY.BLOCK}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setConfirm("clear")}>
            <XCircle className="mr-2 size-4" /> {COPY.CHAT_ITEM_CLEAR}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-wa-danger focus:text-wa-danger"
            onClick={() => setConfirm("delete")}
          >
            <Trash2 className="mr-2 size-4" /> {COPY.CHAT_ITEM_DELETE}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(v) => !v && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete"
                ? COPY.CHAT_ITEM_DELETE_CONFIRM_TITLE
                : COPY.CHAT_ITEM_CLEAR_CONFIRM_TITLE}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? COPY.CHAT_ITEM_DELETE_CONFIRM_BODY
                : COPY.CHAT_ITEM_CLEAR_CONFIRM_BODY}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{COPY.CONFIRM_CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                confirm === "delete" ? onConfirmDelete : onConfirmClear
              }
              className="bg-wa-danger text-white hover:bg-wa-danger/90"
            >
              {confirm === "delete"
                ? COPY.CHAT_ITEM_DELETE
                : COPY.CHAT_ITEM_CLEAR}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LockChatDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        chatId={chat.id}
        currentlyLocked={!!membership?.isLocked}
      />
    </div>
  );
}

// Inline icon for the chat-list preview that hints at the last message type.
function MediaIcon({ type }) {
  if (!type || type === MessageType.TEXT) return null;
  const className = "size-3.5 shrink-0";
  switch (type) {
    case MessageType.IMAGE:
      return <Camera className={className} />;
    case MessageType.VIDEO:
      return <Video className={className} />;
    case MessageType.AUDIO:
    case MessageType.VOICE_NOTE:
      return <Mic className={className} />;
    case MessageType.DOCUMENT:
      return <FileText className={className} />;
    default:
      return null;
  }
}
