"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Crown,
  Loader2,
  Search,
  Shield,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useRemoveCommunityMemberMutation,
  useUpdateCommunityMemberRoleMutation,
} from "@/tanstack/communities/mutations";
import { MemberRole } from "@/models/enums";
import { COMMUNITY_MAX_MEMBERS, COPY } from "@/config/constants";

import { AddCommunityMembersDialog } from "./add-members-dialog";

const ROLE_LABEL = {
  [MemberRole.OWNER]: "Owner",
  [MemberRole.ADMIN]: "Admin",
  [MemberRole.MEMBER]: "Member",
};

// Member-management sheet for a community. Lists members sorted owner →
// admin → member alphabetical, with a search input and a per-row
// dropdown for role changes / remove. The "Add member" button at the
// top opens the AddCommunityMembersDialog.
//
// Action permissions:
//   - Anyone can see the list.
//   - Admins + Owner can remove non-owner members and open Add.
//   - Owner can change anyone's role (including transferring ownership).
export function CommunityMembersSheet({
  open,
  onOpenChange,
  communityId,
  members,
  selfRole,
}) {
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const removeMember = useRemoveCommunityMemberMutation(communityId);
  const updateRole = useUpdateCommunityMemberRoleMutation(communityId);

  const canManage =
    selfRole === MemberRole.OWNER || selfRole === MemberRole.ADMIN;
  const isOwner = selfRole === MemberRole.OWNER;

  // Free-tier cap surface (CO3): show "X / 50" instead of a bare count
  // so admins can see how much headroom they have before the server
  // rejects an addMembers call. The Add button is disabled at cap.
  const memberCount = members?.length ?? 0;
  const atCap = memberCount >= COMMUNITY_MAX_MEMBERS;
  const nearCap = memberCount >= Math.floor(COMMUNITY_MAX_MEMBERS * 0.8);

  const filtered = useMemo(() => {
    const list = members ?? [];
    const q = query.trim().toLowerCase();
    const matched = q
      ? list.filter((m) =>
          (m.user?.name ?? "").toLowerCase().includes(q),
        )
      : list;
    const weight = (r) =>
      r === MemberRole.OWNER ? 0 : r === MemberRole.ADMIN ? 1 : 2;
    return [...matched].sort((a, b) => {
      const w = weight(a.role) - weight(b.role);
      return w !== 0
        ? w
        : (a.user?.name ?? "").localeCompare(b.user?.name ?? "");
    });
  }, [members, query]);

  const existingMemberIds = useMemo(
    () => (members ?? []).map((m) => m.userId),
    [members],
  );

  const onRemove = (targetUserId) => {
    removeMember.mutate(targetUserId, {
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to remove member"),
    });
  };

  const onRoleChange = (targetUserId, role) => {
    updateRole.mutate(
      { targetUserId, role },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to update role"),
      },
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-wa-border bg-wa-panel p-0 text-wa-text sm:max-w-md"
        >
          <SheetHeader className="flex-row items-center gap-2 space-y-0 border-b border-wa-border px-3 py-3 text-left">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <X className="size-4" />
            </Button>
            <SheetTitle className="flex-1 text-sm font-medium text-wa-text">
              {COPY.COMMUNITIES_MEMBERS_TITLE}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {COPY.COMMUNITIES_MEMBERS_TITLE}
            </SheetDescription>
            <span
              className={
                nearCap
                  ? "text-xs font-medium text-wa-danger"
                  : "text-xs text-wa-text-muted"
              }
            >
              {memberCount} / {COMMUNITY_MAX_MEMBERS}
            </span>
          </SheetHeader>

          <div className="shrink-0 px-3 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={COPY.PRIVACY_EXCEPT_SEARCH}
                className="border-0 bg-wa-panel-2 pl-9"
              />
            </div>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              disabled={atCap}
              className="flex items-center gap-3 border-b border-wa-border px-4 py-3 text-left text-sm text-wa-text transition-colors hover:bg-wa-panel-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <span className="grid size-10 place-items-center rounded-full bg-wa-green text-white">
                <UserPlus className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span>{COPY.COMMUNITIES_ADD_MEMBERS}</span>
                {atCap && (
                  <span className="text-xs text-wa-danger">
                    Community is full ({COMMUNITY_MAX_MEMBERS} max on the free
                    tier)
                  </span>
                )}
              </span>
            </button>
          )}

          <ScrollArea className="min-h-0 flex-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-wa-text-muted">
                No members.
              </p>
            ) : (
              <ul className="flex flex-col">
                {filtered.map((m) => (
                  <MemberRow
                    key={m.userId}
                    member={m}
                    canManage={canManage}
                    isOwner={isOwner}
                    onRemove={() => onRemove(m.userId)}
                    onChangeRole={(role) => onRoleChange(m.userId, role)}
                    busy={removeMember.isPending || updateRole.isPending}
                  />
                ))}
              </ul>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AddCommunityMembersDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        communityId={communityId}
        existingMemberIds={existingMemberIds}
      />
    </>
  );
}

function MemberRow({ member, canManage, isOwner, onRemove, onChangeRole, busy }) {
  const u = member.user ?? {};
  const initials = (u.name ?? "??").slice(0, 2).toUpperCase();
  const isMemberOwner = member.role === MemberRole.OWNER;
  // Admin can manage members but NOT promote/demote — only the owner
  // can change roles. Admin can remove non-owner members.
  const showRoleMenu = isOwner;
  const showRemove = canManage && !isMemberOwner;
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Avatar className="size-10">
        <AvatarImage src={u.avatar ?? undefined} alt={u.name} />
        <AvatarFallback className="bg-wa-panel-3 text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-wa-text">{u.name ?? "—"}</span>
        <span className="truncate text-xs text-wa-text-muted">
          {ROLE_LABEL[member.role]}
        </span>
      </div>

      {(showRoleMenu || showRemove) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="More"
              disabled={busy}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {showRoleMenu && !isMemberOwner && (
              <>
                <DropdownMenuItem
                  onClick={() => onChangeRole(MemberRole.OWNER)}
                >
                  <Crown className="mr-2 size-4" /> Make owner
                </DropdownMenuItem>
                {member.role !== MemberRole.ADMIN && (
                  <DropdownMenuItem
                    onClick={() => onChangeRole(MemberRole.ADMIN)}
                  >
                    <Shield className="mr-2 size-4" /> Make admin
                  </DropdownMenuItem>
                )}
                {member.role === MemberRole.ADMIN && (
                  <DropdownMenuItem
                    onClick={() => onChangeRole(MemberRole.MEMBER)}
                  >
                    <Shield className="mr-2 size-4" /> Remove admin
                  </DropdownMenuItem>
                )}
                {showRemove && <DropdownMenuSeparator />}
              </>
            )}
            {showRemove && (
              <DropdownMenuItem
                onClick={onRemove}
                className="text-wa-danger focus:text-wa-danger"
              >
                <Trash2 className="mr-2 size-4" /> Remove from community
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
