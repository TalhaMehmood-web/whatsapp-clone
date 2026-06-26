"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Clock4,
  Heart,
  HeartOff,
  Images,
  Loader2,
  Lock,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useChatMediaQuery,
  useChatQuery,
} from "@/tanstack/chat/queries";
import {
  useClearChatMutation,
  useDeleteChatMutation,
  useFavouriteChatMutation,
} from "@/tanstack/chat/mutations";
import { useAuth } from "@/hooks/use-auth";
import { COPY, ROUTES } from "@/config/constants";
import { ChatMediaBrowser } from "@/features/chat/chat-media-browser/chat-media-browser";
import { ChatMediaPreviewStrip } from "@/features/chat/chat-media-browser/chat-media-preview-strip";
import { LockChatDialog } from "@/features/chat/locked-chats/lock-chat-dialog";
import { DisappearingMessagesDialog } from "@/features/chat/chat-window/disappearing-messages-dialog";

// Right-side drawer for a 1:1 chat header click — mirror of the
// GroupInfoSheet but tuned for direct messages. Matches the WA Web
// "Contact info" layout: big avatar + name + about, a media-links-docs
// preview, starred / disappearing / privacy rows, then favourite, list,
// clear chat, delete chat actions.
export function ContactInfoSheet({ chatId, open, onOpenChange }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data } = useChatQuery(chatId);
  const { data: mediaCatalog } = useChatMediaQuery(chatId, { enabled: open });

  const chat = data?.chat;
  const membership = data?.membership;
  const peer = data?.peers?.[0];
  const peerName = peer?.name ?? "";
  const initials = (peerName || "??").slice(0, 2).toUpperCase();

  const fav = useFavouriteChatMutation();
  const clearChat = useClearChatMutation();
  const deleteChat = useDeleteChatMutation();

  const [mediaOpen, setMediaOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [disappearingOpen, setDisappearingOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // "clear" | "delete" | null

  if (!chat) return null;

  const isFavourite = !!membership?.isFavourite;
  const isLocked = !!membership?.isLocked;
  const disappearingActive = !!chat.disappearingSeconds;
  const mediaSample = mediaCatalog?.media ?? [];
  const docsSample = mediaCatalog?.docs ?? [];
  const mediaTotal =
    (mediaCatalog?.media?.length ?? 0) +
    (mediaCatalog?.docs?.length ?? 0) +
    (mediaCatalog?.links?.length ?? 0);

  const onToggleFavourite = () =>
    fav.mutate(
      { chatId, value: !isFavourite },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to update"),
      },
    );

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

  const onConfirmDelete = () =>
    deleteChat.mutate(chatId, {
      onSuccess: () => {
        setConfirm(null);
        onOpenChange(false);
        router.replace(ROUTES.CHAT_INDEX);
      },
      onError: (err) => {
        setConfirm(null);
        toast.error(err.response?.data?.error ?? "Failed to delete chat");
      },
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-md flex-col gap-0 overflow-hidden border-wa-border bg-wa-panel p-0 text-wa-text"
      >
        <SheetHeader className="flex-row items-center gap-3 space-y-0 border-b border-wa-border px-3 py-3 text-left">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="text-wa-text-muted hover:text-wa-text"
          >
            <X className="size-4" />
          </Button>
          <SheetTitle className="text-base font-medium text-wa-text">
            {COPY.CHAT_HDR_CONTACT_INFO}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {COPY.CHAT_HDR_CONTACT_INFO}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          {/* Hero */}
          <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
            <Avatar className="size-32">
              <AvatarImage src={peer?.avatar ?? undefined} alt={peerName} />
              <AvatarFallback className="bg-wa-panel-3 text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-medium text-wa-text">{peerName}</h2>
              {peer?.handle && (
                <Link
                  href={ROUTES.PROFILE(peer.handle)}
                  onClick={() => onOpenChange(false)}
                  className="text-sm text-wa-green hover:underline"
                >
                  @{peer.handle}
                </Link>
              )}
              {peer?.about && (
                <p className="mt-3 text-sm text-wa-text-muted">
                  ~ {peer.about}
                </p>
              )}
            </div>
          </div>

          {/* Media, links & docs */}
          <button
            type="button"
            onClick={() => setMediaOpen(true)}
            className="flex w-full items-center justify-between gap-3 border-y border-wa-border bg-wa-panel-2/40 px-4 py-3 text-left transition-colors hover:bg-wa-panel-2"
          >
            <div className="flex items-center gap-3">
              <Images className="size-5 text-wa-text-muted" />
              <span className="text-sm text-wa-text">
                {COPY.COMMUNITIES_MEDIA_TITLE}
              </span>
            </div>
            <div className="flex items-center gap-2 text-wa-text-muted">
              <span className="text-xs">{mediaTotal}</span>
              <ChevronRight className="size-4" />
            </div>
          </button>
          <ChatMediaPreviewStrip
            media={mediaSample}
            docs={docsSample}
            onOpen={() => setMediaOpen(true)}
          />

          <Separator />

          {/* Quick rows */}
          <Row
            icon={Star}
            label={COPY.STARRED_MESSAGES}
            asLink
            href={ROUTES.STARRED}
            onClick={() => onOpenChange(false)}
          />
          <Row
            icon={Clock4}
            label={COPY.CHAT_HDR_DISAPPEARING}
            sublabel={
              disappearingActive
                ? formatDisappearing(chat.disappearingSeconds)
                : "Off"
            }
            onClick={() => setDisappearingOpen(true)}
          />
          <Row
            icon={ShieldCheck}
            label="Encryption"
            sublabel="Messages are end-to-end encrypted."
          />
          <Row
            icon={Lock}
            label={isLocked ? COPY.UNLOCK_CHAT : COPY.LOCK_CHAT}
            onClick={() => setLockOpen(true)}
          />

          <Separator />

          <Row
            icon={isFavourite ? HeartOff : Heart}
            label={
              isFavourite
                ? COPY.REMOVE_FROM_FAVOURITES
                : COPY.ADD_TO_FAVOURITES
            }
            onClick={onToggleFavourite}
          />
          <Row
            icon={Tag}
            label={COPY.CHAT_ITEM_ADD_TO_LIST}
            onClick={() => onOpenChange(false)}
          />

          <Separator />

          <Row
            icon={XCircle}
            label={COPY.CHAT_ITEM_CLEAR}
            destructive
            onClick={() => setConfirm("clear")}
          />
          <Row
            icon={Trash2}
            label={COPY.CHAT_ITEM_DELETE}
            destructive
            onClick={() => setConfirm("delete")}
          />
        </ScrollArea>
      </SheetContent>

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
              {confirm === "delete" ? COPY.CHAT_ITEM_DELETE : COPY.CHAT_ITEM_CLEAR}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

function Row({
  icon: Icon,
  label,
  sublabel,
  destructive = false,
  onClick,
  asLink = false,
  href,
}) {
  const inner = (
    <>
      <Icon
        className={
          destructive
            ? "size-5 shrink-0 text-wa-danger"
            : "size-5 shrink-0 text-wa-text-muted"
        }
      />
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <span
          className={
            destructive
              ? "text-sm text-wa-danger"
              : "text-sm text-wa-text"
          }
        >
          {label}
        </span>
        {sublabel && (
          <span className="text-xs text-wa-text-muted">{sublabel}</span>
        )}
      </div>
    </>
  );
  const className =
    "flex w-full items-center gap-4 px-6 py-3 transition-colors hover:bg-wa-panel-2";

  if (asLink && href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

function formatDisappearing(seconds) {
  const d = Math.round(seconds / 86_400);
  if (d >= 90) return "90 days";
  if (d >= 7) return "7 days";
  if (d >= 1) return "24 hours";
  return "On";
}
