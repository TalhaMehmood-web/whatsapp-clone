"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Folder,
  Link as LinkIcon,
  Loader2,
  LogOut,
  MoreVertical,
  Pencil,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useCommunityQuery } from "@/tanstack/communities/queries";
import {
  useDeleteCommunityMutation,
  useLeaveCommunityMutation,
} from "@/tanstack/communities/mutations";
import { MemberRole } from "@/models/enums";
import { COPY, ROUTES } from "@/config/constants";

import { CommunityMembersSheet } from "./community-members-sheet";
import { AddSubGroupDialog } from "./add-sub-group-dialog";
import { EditCommunityDialog } from "./edit-community-dialog";
import { ReportCommunityDialog } from "./report-community-dialog";

// Community detail pane. Replaces the original read-only stub with a
// fully-wired management surface:
//
//   - Hero: avatar + name + member count + invite link copy.
//   - Description.
//   - Sub-group list with "Add member group" affordance for admins.
//   - 3-dot menu: invite link, members sheet, leave, delete.
//   - Leave / delete confirm via AlertDialog.
//
// Uses the existing useCommunityQuery (staleTime: Infinity); the
// realtime sync hook patches the cache when COMMUNITY_UPDATE arrives,
// so this page never re-fetches just because the user navigated.
export function CommunityDetail({ id }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: community, isLoading } = useCommunityQuery(id);

  const [membersOpen, setMembersOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // "leave" | "delete" | null

  const leave = useLeaveCommunityMutation();
  const del = useDeleteCommunityMutation();

  const me = useMemo(
    () => community?.members?.find((m) => m.userId === user?.id),
    [community, user?.id],
  );
  const selfRole = me?.role ?? null;
  const isOwner = selfRole === MemberRole.OWNER;
  const canManage =
    selfRole === MemberRole.OWNER || selfRole === MemberRole.ADMIN;

  const existingChatIds = useMemo(
    () => (community?.chats ?? []).map((c) => c.id),
    [community?.chats],
  );

  if (isLoading || !community) {
    return (
      <div className="flex h-full items-center justify-center bg-wa-bg text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const initials = (community.name ?? "??").slice(0, 2).toUpperCase();
  const inviteUrl = community.handle
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/c/${community.handle}`
    : null;

  const copyInvite = async () => {
    if (!inviteUrl) {
      toast.error(
        "Set a community handle first (3-dot menu → edit) to create an invite link.",
      );
      return;
    }
    await navigator.clipboard.writeText(inviteUrl);
    toast.success(COPY.COMMUNITIES_INVITE_COPIED);
  };

  const onConfirmLeave = () =>
    leave.mutate(id, {
      onSuccess: () => {
        setConfirm(null);
        router.replace(ROUTES.COMMUNITIES);
      },
      onError: (err) => {
        setConfirm(null);
        toast.error(err.response?.data?.error ?? "Failed to leave");
      },
    });

  const onConfirmDelete = () =>
    del.mutate(id, {
      onSuccess: () => {
        setConfirm(null);
        router.replace(ROUTES.COMMUNITIES);
      },
      onError: (err) => {
        setConfirm(null);
        toast.error(err.response?.data?.error ?? "Failed to delete");
      },
    });

  return (
    <div className="flex h-full flex-col bg-wa-bg">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-wa-border bg-wa-panel-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          {/* Mobile-only back arrow. The SplitPane hides the
              communities list at <md while detail is mounted, so without
              this the user is trapped on the detail screen. */}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Back"
            onClick={() => router.push(ROUTES.COMMUNITIES)}
            className="text-wa-text-muted hover:text-wa-text md:hidden"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <Avatar className="size-10 rounded-lg">
            <AvatarImage src={community.photo ?? undefined} alt={community.name} />
            <AvatarFallback className="rounded-lg bg-wa-panel-3 text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-wa-text">
              {community.name}
            </p>
            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              className="flex items-center gap-1 truncate text-[12px] text-wa-text-muted hover:text-wa-text"
            >
              <Users className="size-3" />
              {community.members.length} member
              {community.members.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-wa-text-muted">
          {inviteUrl && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={COPY.COMMUNITIES_INVITE_LINK}
              onClick={copyInvite}
              className="hover:text-wa-text"
            >
              <LinkIcon className="size-5" />
            </Button>
          )}
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
              <DropdownMenuItem onClick={() => setMembersOpen(true)}>
                <Users className="mr-2 size-4" /> {COPY.COMMUNITIES_MEMBERS_TITLE}
              </DropdownMenuItem>
              {canManage && (
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 size-4" /> Edit community
                </DropdownMenuItem>
              )}
              {canManage && (
                <DropdownMenuItem onClick={() => setAddGroupOpen(true)}>
                  <Folder className="mr-2 size-4" /> {COPY.COMMUNITIES_SUB_GROUP_ADD}
                </DropdownMenuItem>
              )}
              {canManage && (
                <DropdownMenuItem onClick={() => setMembersOpen(true)}>
                  <UserPlus className="mr-2 size-4" /> {COPY.COMMUNITIES_ADD_MEMBERS}
                </DropdownMenuItem>
              )}
              {inviteUrl && (
                <DropdownMenuItem onClick={copyInvite}>
                  <Copy className="mr-2 size-4" /> Copy invite link
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {!isOwner && (
                <DropdownMenuItem
                  onClick={() => setReportOpen(true)}
                  className="text-wa-danger focus:text-wa-danger"
                >
                  <AlertTriangle className="mr-2 size-4" /> Report community
                </DropdownMenuItem>
              )}
              {!isOwner && (
                <DropdownMenuItem
                  onClick={() => setConfirm("leave")}
                  className="text-wa-danger focus:text-wa-danger"
                >
                  <LogOut className="mr-2 size-4" /> {COPY.COMMUNITIES_LEAVE}
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem
                  onClick={() => setConfirm("delete")}
                  className="text-wa-danger focus:text-wa-danger"
                >
                  <Trash2 className="mr-2 size-4" /> {COPY.COMMUNITIES_DELETE}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ScrollArea className="flex-1">
        {community.description && (
          <p className="px-4 py-4 text-sm text-wa-text-muted sm:px-6">
            {community.description}
          </p>
        )}

        <Separator />
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <h2 className="text-[11px] uppercase tracking-wider text-wa-text-muted">
            Groups · {community.chats.length}
          </h2>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddGroupOpen(true)}
              className="text-wa-green hover:text-wa-green/90"
            >
              <Folder className="mr-1 size-4" /> Add
            </Button>
          )}
        </div>

        {community.chats.length === 0 ? (
          <div className="mx-auto my-6 flex max-w-md flex-col items-center gap-4 rounded-lg border border-wa-border bg-wa-panel p-6 text-center">
            <h3 className="text-base font-medium text-wa-text">
              No groups in this community yet
            </h3>
            <p className="text-sm text-wa-text-muted">
              {canManage
                ? "Add a member group to start the conversation."
                : "An admin can add member groups so everyone can chat."}
            </p>
            {canManage && (
              <Button
                onClick={() => setAddGroupOpen(true)}
                className="bg-wa-green text-white hover:bg-wa-green/90"
              >
                <Folder className="mr-2 size-4" />
                {COPY.COMMUNITIES_SUB_GROUP_ADD}
              </Button>
            )}
          </div>
        ) : (
          community.chats.map((chat) => (
            <Link
              key={chat.id}
              href={ROUTES.CHAT_DETAIL(chat.id)}
              className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-wa-panel-2 sm:px-4"
            >
              <Avatar className="size-10 rounded-md">
                <AvatarImage src={chat.photo ?? undefined} alt={chat.name} />
                <AvatarFallback className="rounded-md bg-wa-panel-3 text-[10px]">
                  {(chat.name ?? "??").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-wa-text">{chat.name}</span>
                {chat.lastMessage?.content && (
                  <span className="truncate text-xs text-wa-text-muted">
                    {chat.lastMessage.content}
                  </span>
                )}
              </div>
              <Folder className="size-4 shrink-0 text-wa-text-muted" />
            </Link>
          ))
        )}
      </ScrollArea>

      <CommunityMembersSheet
        open={membersOpen}
        onOpenChange={setMembersOpen}
        communityId={id}
        members={community.members}
        selfRole={selfRole}
      />

      <AddSubGroupDialog
        open={addGroupOpen}
        onOpenChange={setAddGroupOpen}
        communityId={id}
        existingChatIds={existingChatIds}
      />

      <EditCommunityDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        community={community}
      />

      <ReportCommunityDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        communityId={id}
      />

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(v) => !v && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete"
                ? COPY.COMMUNITIES_DELETE
                : COPY.COMMUNITIES_LEAVE}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "This deletes the community for everyone and removes its sub-groups. This can't be undone."
                : "You'll stop receiving updates from this community."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{COPY.CONFIRM_CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                confirm === "delete" ? onConfirmDelete : onConfirmLeave
              }
              className="bg-wa-danger text-white hover:bg-wa-danger/90"
            >
              {confirm === "delete"
                ? COPY.COMMUNITIES_DELETE
                : COPY.COMMUNITIES_LEAVE}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
