"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  ChevronRight,
  ClipboardList,
  Flag,
  Heart,
  HeartOff,
  Images,
  Loader2,
  LogOut,
  Search,
  ShieldCheck,
  Star,
  Tag,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useChatMediaQuery,
  useChatQuery,
} from "@/tanstack/chat/queries";
import {
  useClearChatMutation,
  useFavouriteChatMutation,
  useMuteChatMutation,
} from "@/tanstack/chat/mutations";
import { useGroupMembersQuery } from "@/tanstack/groups/queries";
import { useLeaveGroupMutation } from "@/tanstack/groups/mutations";
import { useAuth } from "@/hooks/use-auth";
import { ChatMediaBrowser } from "@/features/chat/chat-media-browser/chat-media-browser";
import { ChatMediaPreviewStrip } from "@/features/chat/chat-media-browser/chat-media-preview-strip";
import { MemberRole } from "@/models/enums";
import { COPY, DURATION, ROUTES } from "@/config/constants";

import { GroupInfoMemberRow } from "./group-info-member-row";
import { GroupInfoAddMembersRow } from "./group-info-add-members-row";

// Right-side drawer triggered from the chat header for a group chat.
// Mirrors WhatsApp Web's "Group info" panel from the screenshots — hero,
// description, media preview, quick rows (starred, notifications,
// encryption), full member list with admin tools, then the
// favourite/list/clear/exit/report actions.
export function GroupInfoSheet({ chatId, open, onOpenChange }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data } = useChatQuery(chatId);
  const { data: members, isLoading } = useGroupMembersQuery(chatId);
  const { data: mediaCatalog } = useChatMediaQuery(chatId, { enabled: open });
  const leave = useLeaveGroupMutation(chatId);
  const fav = useFavouriteChatMutation();
  const mute = useMuteChatMutation();
  const clearChat = useClearChatMutation();

  const [browserOpen, setBrowserOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // "clear" | "leave" | "report" | null
  const [memberQuery, setMemberQuery] = useState("");
  const [showAllMembers, setShowAllMembers] = useState(false);

  const chat = data?.chat;
  const membership = data?.membership;

  const self = members?.find((m) => m.userId === user?.id);
  const canManage = self && self.role !== MemberRole.MEMBER;
  const existingIds = (members ?? []).map((m) => m.userId);
  const isFavourite = !!membership?.isFavourite;
  const isMuted = membership?.mutedUntil
    ? new Date(membership.mutedUntil) > new Date()
    : false;

  const filteredMembers = useMemo(() => {
    const list = members ?? [];
    const q = memberQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) => {
      const name = m.user?.name?.toLowerCase() ?? "";
      const handle = m.user?.handle?.toLowerCase() ?? "";
      return name.includes(q) || handle.includes(q);
    });
  }, [members, memberQuery]);

  // Order rows like the screenshot: current user first ("You"), then
  // OWNER, then ADMIN, then MEMBER alphabetically.
  const sortedMembers = useMemo(() => {
    const roleWeight = (r) =>
      r === MemberRole.OWNER ? 0 : r === MemberRole.ADMIN ? 1 : 2;
    return [...filteredMembers].sort((a, b) => {
      const aSelf = a.userId === user?.id ? 0 : 1;
      const bSelf = b.userId === user?.id ? 0 : 1;
      if (aSelf !== bSelf) return aSelf - bSelf;
      const ar = roleWeight(a.role);
      const br = roleWeight(b.role);
      if (ar !== br) return ar - br;
      return (a.user?.name ?? "").localeCompare(b.user?.name ?? "");
    });
  }, [filteredMembers, user?.id]);

  const mediaSample = mediaCatalog?.media ?? [];
  const docsSample = mediaCatalog?.docs ?? [];
  const mediaTotal =
    (mediaCatalog?.media?.length ?? 0) +
    (mediaCatalog?.docs?.length ?? 0) +
    (mediaCatalog?.links?.length ?? 0);

  if (!chat) return null;

  const onToggleFavourite = () =>
    fav.mutate(
      { chatId, value: !isFavourite },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to update"),
      },
    );

  const onMute = (durationMs) =>
    mute.mutate(
      { chatId, value: true, durationMs },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Could not mute"),
      },
    );

  const onUnmute = () =>
    mute.mutate(
      { chatId, value: false },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Could not unmute"),
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

  const onConfirmLeave = () =>
    leave.mutate(undefined, {
      onSuccess: () => {
        setConfirm(null);
        onOpenChange(false);
        router.replace(ROUTES.CHAT_INDEX);
      },
      onError: (err) => {
        setConfirm(null);
        toast.error(err.response?.data?.error ?? "Could not leave");
      },
    });

  const onConfirmReport = () => {
    setConfirm(null);
    toast.success("Report submitted");
  };

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
            {COPY.GROUP_INFO_TITLE}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {COPY.GROUP_INFO_TITLE}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          {/* Hero */}
          <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
            <Avatar className="size-32">
              <AvatarImage src={chat.photo ?? undefined} alt={chat.name ?? ""} />
              <AvatarFallback className="bg-wa-panel-3 text-2xl">
                {(chat.name ?? "??").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-medium text-wa-text">{chat.name}</h2>
              <p className="text-sm text-wa-text-muted">
                Group · {members?.length ?? 0} members
              </p>
            </div>
            {chat.description && (
              <p className="mt-2 text-sm text-wa-text-muted">
                {chat.description}
              </p>
            )}
          </div>

          {/* Media, links and docs */}
          <button
            type="button"
            onClick={() => setBrowserOpen(true)}
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
            onOpen={() => setBrowserOpen(true)}
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

          <NotificationsRow
            isMuted={isMuted}
            mutedUntil={membership?.mutedUntil}
            onMute={onMute}
            onUnmute={onUnmute}
          />

          <Row
            icon={ShieldCheck}
            label="Encryption"
            sublabel="Messages are end-to-end encrypted."
          />

          <Separator />

          {/* Members */}
          <div className="px-4 pt-4 pb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-wa-text-muted">
              {members?.length ?? 0} members
            </span>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
              <Input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Search members"
                className="h-9 rounded-full border-0 bg-wa-panel-2 pl-10"
              />
            </div>
          </div>

          {canManage && (
            <GroupInfoAddMembersRow
              chatId={chatId}
              existingIds={existingIds}
            />
          )}

          {isLoading ? (
            <div className="flex justify-center py-6 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <p className="px-6 py-4 text-center text-sm text-wa-text-muted">
              No members match your search.
            </p>
          ) : (
            <>
              {/* Render the current user first, then everyone else by
                  role (admins / members). Cap at 10 rows when the user
                  hasn't expanded the list, matching the screenshot. */}
              {(showAllMembers
                ? sortedMembers
                : sortedMembers.slice(0, 10)
              ).map((m) => (
                <GroupInfoMemberRow
                  key={m.id}
                  chatId={chatId}
                  member={m}
                  canManage={canManage}
                  isSelf={m.userId === user?.id}
                />
              ))}
              {!showAllMembers && sortedMembers.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllMembers(true)}
                  className="flex w-full items-center px-4 py-3 text-sm text-wa-green hover:bg-wa-panel-2"
                >
                  View all ({sortedMembers.length - 10} more)
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => toast.info("Member-change history is coming soon.")}
            className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-wa-panel-2"
          >
            <ClipboardList className="size-5 shrink-0 text-wa-text-muted" />
            <span className="text-sm text-wa-text">View member changes</span>
          </button>

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
            icon={LogOut}
            label={COPY.GROUP_INFO_LEAVE}
            destructive
            onClick={() => setConfirm("leave")}
          />
          <Row
            icon={Flag}
            label="Report group"
            destructive
            onClick={() => setConfirm("report")}
          />

          <div className="px-6 py-4 text-center text-xs text-wa-text-muted">
            Group created on{" "}
            {new Date(chat.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </ScrollArea>
      </SheetContent>

      <ChatMediaBrowser
        chatId={chatId}
        open={browserOpen}
        onOpenChange={setBrowserOpen}
      />

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(v) => !v && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{titleFor(confirm)}</AlertDialogTitle>
            <AlertDialogDescription>{bodyFor(confirm)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{COPY.CONFIRM_CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                confirm === "leave"
                  ? onConfirmLeave
                  : confirm === "report"
                    ? onConfirmReport
                    : onConfirmClear
              }
              className="bg-wa-danger text-white hover:bg-wa-danger/90"
            >
              {ctaFor(confirm)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

function NotificationsRow({ isMuted, mutedUntil, onMute, onUnmute }) {
  const sublabel = isMuted
    ? mutedUntil
      ? `Muted until ${new Date(mutedUntil).toLocaleDateString()}`
      : "Muted"
    : "On";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-wa-panel-2"
        >
          {isMuted ? (
            <BellOff className="size-5 shrink-0 text-wa-text-muted" />
          ) : (
            <Bell className="size-5 shrink-0 text-wa-text-muted" />
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm text-wa-text">Notification settings</span>
            <span className="text-xs text-wa-text-muted">{sublabel}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {isMuted ? (
          <DropdownMenuItem onClick={onUnmute}>
            <Bell className="mr-2 size-4" /> {COPY.UNMUTE}
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={() => onMute(DURATION.MUTE_8H)}>
              8 hours
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMute(DURATION.MUTE_1W)}>
              1 week
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onMute(DURATION.MUTE_ALWAYS)}>
              Always
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
            destructive ? "text-sm text-wa-danger" : "text-sm text-wa-text"
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

function titleFor(kind) {
  if (kind === "leave") return "Leave this group?";
  if (kind === "report") return "Report this group?";
  return COPY.CHAT_ITEM_CLEAR_CONFIRM_TITLE;
}

function bodyFor(kind) {
  if (kind === "leave")
    return "You'll stop receiving messages. The group stays for everyone else.";
  if (kind === "report")
    return "A copy of the most recent messages from this group will be sent to moderation.";
  return COPY.CHAT_ITEM_CLEAR_CONFIRM_BODY;
}

function ctaFor(kind) {
  if (kind === "leave") return COPY.GROUP_INFO_LEAVE;
  if (kind === "report") return "Report";
  return COPY.CHAT_ITEM_CLEAR;
}
