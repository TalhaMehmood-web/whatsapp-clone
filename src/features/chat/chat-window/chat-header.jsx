"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckSquare,
  Clock4,
  Flag,
  Heart,
  HeartOff,
  Images,
  Info,
  Link2,
  Lock,
  LogOut,
  MoreVertical,
  Phone,
  Search,
  Star,
  Tag,
  Trash2,
  UserX,
  Video,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useChatQuery } from "@/tanstack/chat/queries";
import { useStartCallMutation } from "@/tanstack/calls/mutations";
import {
  useClearChatMutation,
  useDeleteChatMutation,
  useFavouriteChatMutation,
} from "@/tanstack/chat/mutations";
import { useLeaveGroupMutation } from "@/tanstack/groups/mutations";
import { lastSeenLabel } from "@/utils/date-format";
import { useChatTyping } from "@/hooks/use-typing-indicator";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/stores/ui-store";
import { useBlockedUsersQuery } from "@/tanstack/users/queries";
import {
  useBlockUserMutation,
  useUnblockUserMutation,
} from "@/tanstack/users/mutations";
import { ChatLabelSubmenu } from "@/features/chat/labels/chat-label-menu";
import { CallType } from "@/models/enums";
import { COPY, ROUTES } from "@/config/constants";
import { GroupInfoSheet } from "@/features/chat/group-info/group-info-sheet";
import { ContactInfoSheet } from "@/features/chat/contact-info/contact-info-sheet";
import { ChatMediaBrowser } from "@/features/chat/chat-media-browser/chat-media-browser";
import { LockChatDialog } from "@/features/chat/locked-chats/lock-chat-dialog";
import { DisappearingMessagesDialog } from "./disappearing-messages-dialog";
import { NewCallLinkDialog } from "@/features/calls/call-link-dialog/new-call-link-dialog";

export function ChatHeader({ chatId }) {
  const { data } = useChatQuery(chatId);
  const { user } = useAuth();
  const typingSet = useChatTyping(chatId);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [disappearingOpen, setDisappearingOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // "clear" | "delete" | null
  const chat = data?.chat;
  const peers = data?.peers ?? [];

  // Selection mode mounts a bulk-action bar at the bottom of the chat
  // panel — the header itself stays put.
  const startSelection = useUiStore((s) => s.startSelection);

  // Chat-list mutations the menu hooks into.
  const fav = useFavouriteChatMutation();
  const clearChat = useClearChatMutation();
  const deleteChat = useDeleteChatMutation();
  const leaveGroup = useLeaveGroupMutation(chatId);
  const openLabels = useUiStore((s) => s.openManageLabels);

  const displayName = chat?.isGroup ? chat?.name : peers[0]?.name ?? "";
  const photo = chat?.isGroup ? chat?.photo : peers[0]?.avatar;
  const initials = (displayName || "??").slice(0, 2).toUpperCase();

  const typers = typingSet
    ? [...typingSet].filter((id) => id !== user?.id)
    : [];

  const presence = typers.length > 0
    ? typingLabel(typers, peers, chat?.isGroup)
    : chat?.isGroup
      ? peers.map((p) => p.name).join(", ")
      : peers[0]?.isOnline
        ? "online"
        : lastSeenLabel(peers[0]?.lastSeen);

  const isGroup = !!chat?.isGroup;
  const peer = isGroup ? null : peers[0] ?? null;
  const toggleChatSearch = useUiStore((s) => s.toggleChatSearch);

  const { data: blocked } = useBlockedUsersQuery();
  const isBlocked = peer && (blocked ?? []).some((b) => b.id === peer.id);
  const block = useBlockUserMutation();
  const unblock = useUnblockUserMutation();

  const toggleBlock = () => {
    if (!peer) return;
    const fn = isBlocked ? unblock.mutate : block.mutate;
    const arg = isBlocked ? peer.id : peer;
    fn(arg, {
      onError: (err) => toast.error(err.response?.data?.error ?? "Failed"),
    });
  };

  const router = useRouter();
  const startCall = useStartCallMutation();
  const callPeerIds = peers.map((p) => p.id);
  const canCall = callPeerIds.length > 0 && !isBlocked;

  const onStartCall = (type) => {
    if (!canCall || startCall.isPending) return;
    startCall.mutate(
      { participantIds: callPeerIds, type },
      {
        onSuccess: (call) => router.push(`${ROUTES.CALLS}/${call.id}`),
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Could not start call"),
      },
    );
  };

  const membership = data?.membership;
  const isFavourite = !!membership?.isFavourite;
  const isLocked = !!membership?.isLocked;
  const assignedLabelIds = []; // labels list lives on the chat-list cache; menu still toggles via the labels mutation
  const disappearingActive = !!chat?.disappearingSeconds;

  // ---- Menu action handlers ----------------------------------------------
  const onClose = () => router.push(ROUTES.CHAT_INDEX);
  const onSelect = () => startSelection(chatId);
  const onToggleFavourite = () =>
    fav.mutate(
      { chatId, value: !isFavourite },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to update"),
      },
    );

  // "Send call link" opens the NewCallLinkDialog (type picker + copy +
  // send to chat). State lives below — the menu item just flips the flag.
  const [callLinkOpen, setCallLinkOpen] = useState(false);

  // ---- Destructive confirms ----------------------------------------------
  const onConfirmClear = () =>
    clearChat.mutate(chatId, {
      onSuccess: () => {
        setConfirm(null);
        toast.success("Chat cleared");
      },
      onError: (err) => {
        setConfirm(null);
        toast.error(err.response?.data?.error ?? "Failed to clear chat");
      },
    });

  const onConfirmDelete = () => {
    if (isGroup) {
      leaveGroup.mutate(undefined, {
        onSuccess: () => {
          setConfirm(null);
          router.replace(ROUTES.CHAT_INDEX);
        },
        onError: (err) => {
          setConfirm(null);
          toast.error(err.response?.data?.error ?? "Failed to leave group");
        },
      });
      return;
    }
    deleteChat.mutate(chatId, {
      onSuccess: () => {
        setConfirm(null);
        router.replace(ROUTES.CHAT_INDEX);
      },
      onError: (err) => {
        setConfirm(null);
        toast.error(err.response?.data?.error ?? "Failed to delete chat");
      },
    });
  };

  // Selection mode keeps the normal header — the bulk-actions bar lives
  // at the bottom of the chat panel (mounted by ChatDetailPage).

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-wa-border bg-wa-panel-2 px-2 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <Button
          asChild
          variant="ghost"
          size="icon"
          aria-label="Back"
          className="md:hidden text-wa-text-muted hover:text-wa-text"
        >
          <Link href={ROUTES.CHAT_INDEX}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        {/* Tap target:
              - group → open group info sheet
              - 1:1 → navigate to /u/<peer-handle> when we have a handle. */}
        {isGroup ? (
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left transition-colors hover:bg-wa-panel-3"
          >
            <Avatar className="size-10">
              <AvatarImage src={photo ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-wa-panel-3 text-xs text-wa-text">
                {initials}
              </AvatarFallback>
            </Avatar>
            <PeerLabel
              displayName={displayName}
              presence={presence}
              typing={typers.length > 0}
              disappearingActive={disappearingActive}
            />
          </button>
        ) : peer ? (
          // Tap the peer block to open the Contact info sheet — matches
          // WhatsApp Web. The dedicated public profile route is still
          // reachable from inside the sheet.
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left transition-colors hover:bg-wa-panel-3"
          >
            <Avatar className="size-10">
              <AvatarImage src={photo ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-wa-panel-3 text-xs text-wa-text">
                {initials}
              </AvatarFallback>
            </Avatar>
            <PeerLabel
              displayName={displayName}
              presence={presence}
              typing={typers.length > 0}
              disappearingActive={disappearingActive}
            />
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={photo ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-wa-panel-3 text-xs text-wa-text">
                {initials}
              </AvatarFallback>
            </Avatar>
            <PeerLabel
              displayName={displayName}
              presence={presence}
              typing={typers.length > 0}
              disappearingActive={disappearingActive}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-wa-text-muted">
        <Button
          variant="ghost"
          size="icon"
          aria-label={COPY.CALL_VIDEO}
          className="hover:text-wa-text"
          onClick={() => onStartCall(CallType.VIDEO)}
          disabled={!canCall || startCall.isPending}
        >
          <Video className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={COPY.CALL_VOICE}
          className="hover:text-wa-text"
          onClick={() => onStartCall(CallType.VOICE)}
          disabled={!canCall || startCall.isPending}
        >
          <Phone className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          className="hover:text-wa-text"
          onClick={() => toggleChatSearch(chatId)}
        >
          <Search className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="More"
              className="hover:text-wa-text"
            >
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Contact info / Group info — opens the right-side info
                sheet. 1:1 chats use the ContactInfoSheet that mirrors WA
                Web's "Contact info" panel; groups open the group sheet. */}
            <DropdownMenuItem
              onClick={() => (isGroup ? setInfoOpen(true) : setContactOpen(true))}
            >
              <Info className="mr-2 size-4" />
              {isGroup ? COPY.CHAT_HDR_GROUP_INFO : COPY.CHAT_HDR_CONTACT_INFO}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => toggleChatSearch(chatId)}>
              <Search className="mr-2 size-4" /> {COPY.CHAT_HDR_SEARCH}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onSelect}>
              <CheckSquare className="mr-2 size-4" />
              {COPY.CHAT_HDR_SELECT_MESSAGES}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setDisappearingOpen(true)}>
              <Clock4 className="mr-2 size-4" />
              {COPY.CHAT_HDR_DISAPPEARING}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setLockOpen(true)}>
              <Lock className="mr-2 size-4" />
              {isLocked ? COPY.UNLOCK_CHAT : COPY.LOCK_CHAT}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleFavourite}>
              {isFavourite ? (
                <>
                  <HeartOff className="mr-2 size-4" />
                  {COPY.REMOVE_FROM_FAVOURITES}
                </>
              ) : (
                <>
                  <Heart className="mr-2 size-4" />
                  {COPY.ADD_TO_FAVOURITES}
                </>
              )}
            </DropdownMenuItem>

            <ChatLabelSubmenu
              chatId={chatId}
              assignedIds={assignedLabelIds}
              onManage={openLabels}
              triggerLabel={COPY.CHAT_ITEM_ADD_TO_LIST}
            />

            <DropdownMenuItem onClick={() => setMediaOpen(true)}>
              <Images className="mr-2 size-4" /> {COPY.COMMUNITIES_MEDIA_TITLE}
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={ROUTES.STARRED}>
                <Star className="mr-2 size-4" /> {COPY.STARRED_MESSAGES}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onClose}>
              <X className="mr-2 size-4" /> {COPY.CHAT_HDR_CLOSE}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setCallLinkOpen(true)}
              disabled={!canCall}
            >
              <Link2 className="mr-2 size-4" /> {COPY.CHAT_HDR_SEND_CALL_LINK}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {peer && (
              <DropdownMenuItem
                onClick={toggleBlock}
                disabled={block.isPending || unblock.isPending}
                className={
                  !isBlocked ? "text-wa-danger focus:text-wa-danger" : undefined
                }
              >
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
              {isGroup ? (
                <>
                  <LogOut className="mr-2 size-4" />
                  {COPY.GROUP_INFO_LEAVE}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  {COPY.CHAT_ITEM_DELETE}
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isGroup && (
        <GroupInfoSheet
          chatId={chatId}
          open={infoOpen}
          onOpenChange={setInfoOpen}
        />
      )}
      {!isGroup && (
        <ContactInfoSheet
          chatId={chatId}
          open={contactOpen}
          onOpenChange={setContactOpen}
        />
      )}
      <ChatMediaBrowser
        chatId={chatId}
        open={mediaOpen}
        onOpenChange={setMediaOpen}
      />

      <LockChatDialog
        chatId={chatId}
        open={lockOpen}
        onOpenChange={setLockOpen}
        currentlyLocked={isLocked}
      />

      <DisappearingMessagesDialog
        chatId={chatId}
        open={disappearingOpen}
        onOpenChange={setDisappearingOpen}
      />

      <NewCallLinkDialog
        open={callLinkOpen}
        onOpenChange={setCallLinkOpen}
        chatId={chatId}
        participantIds={callPeerIds}
      />

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(v) => !v && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete"
                ? isGroup
                  ? COPY.GROUP_INFO_LEAVE
                  : COPY.CHAT_ITEM_DELETE_CONFIRM_TITLE
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
                ? isGroup
                  ? COPY.GROUP_INFO_LEAVE
                  : COPY.CHAT_ITEM_DELETE
                : COPY.CHAT_ITEM_CLEAR}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

function PeerLabel({ displayName, presence, typing, disappearingActive }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="flex min-w-0 items-center gap-1 truncate text-[15px] font-medium text-wa-text">
        <span className="truncate">{displayName}</span>
        {disappearingActive && (
          <Clock4
            className="size-3.5 shrink-0 text-wa-text-muted"
            aria-label={COPY.DISAPPEARING_ACTIVE}
          />
        )}
      </span>
      {presence && (
        <span
          className={`truncate text-[12px] ${
            typing ? "text-wa-green" : "text-wa-text-muted"
          }`}
        >
          {presence}
        </span>
      )}
    </div>
  );
}

function typingLabel(typerIds, peers, isGroup) {
  if (!isGroup) return "typing…";
  const names = typerIds
    .map((id) => peers.find((p) => p.id === id)?.name)
    .filter(Boolean);
  if (names.length === 0) return "typing…";
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names[0]} and ${names.length - 1} others are typing…`;
}
