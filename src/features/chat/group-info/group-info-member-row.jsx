"use client";

import { ChevronDown, Shield, ShieldOff, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
} from "@/tanstack/groups/mutations";
import { MemberRole } from "@/models/enums";
import { COPY } from "@/config/constants";
import { cn } from "@/utils/cn";

// One row in the group-info member list, matching the WhatsApp Web look:
//   avatar | name (+ "about" or "Administrator" subline) | admin badge | phone
//
// The whole row is the dropdown trigger when the viewer can manage the
// group (a small chevron appears on hover). For the current user we just
// show "You" instead of their name and keep the row inert.
export function GroupInfoMemberRow({ chatId, member, canManage, isSelf }) {
  const remove = useRemoveMemberMutation(chatId);
  const updateRole = useUpdateMemberRoleMutation(chatId);

  const isAdmin = member.role !== MemberRole.MEMBER;
  const isOwner = member.role === MemberRole.OWNER;
  const canRowOpenMenu = canManage && !isSelf && !isOwner;

  const u = member.user ?? {};
  const displayName = isSelf ? "You" : u.name ?? "Unknown";
  const initials = (displayName ?? "??").slice(0, 2).toUpperCase();
  const subline = isSelf
    ? "Add member tag"
    : isOwner
      ? "Administrator"
      : isAdmin
        ? "Admin"
        : u.about ?? null;
  const phone = formatPhone(u.phone);

  const row = (
    <div
      className={cn(
        "group flex w-full items-center gap-3 px-4 py-2 transition-colors",
        canRowOpenMenu ? "cursor-pointer hover:bg-wa-panel-2" : null,
      )}
    >
      <Avatar className="size-10">
        <AvatarImage src={u.avatar ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-wa-panel-3 text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col text-left">
        <span className="truncate text-sm text-wa-text">{displayName}</span>
        {subline && (
          <span
            className={cn(
              "truncate text-xs",
              isSelf ? "text-wa-green" : "text-wa-text-muted",
            )}
          >
            {subline}
          </span>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        {isAdmin && (
          <span className="rounded-md bg-wa-panel-2 px-2 py-0.5 text-[11px] font-medium text-wa-green">
            Group admin
          </span>
        )}
        {phone && (
          <span className="text-xs text-wa-text-muted">{phone}</span>
        )}
      </div>

      {canRowOpenMenu && (
        <ChevronDown className="ml-1 size-4 shrink-0 text-wa-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );

  if (!canRowOpenMenu) return row;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="block w-full text-left">
          {row}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isAdmin ? (
          <DropdownMenuItem
            onClick={() =>
              updateRole.mutate(
                { userId: member.userId, role: MemberRole.MEMBER },
                {
                  onError: (err) =>
                    toast.error(err.response?.data?.error ?? "Failed"),
                },
              )
            }
          >
            <ShieldOff className="mr-2 size-4" />
            {COPY.GROUP_INFO_REVOKE_ADMIN}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              updateRole.mutate(
                { userId: member.userId, role: MemberRole.ADMIN },
                {
                  onError: (err) =>
                    toast.error(err.response?.data?.error ?? "Failed"),
                },
              )
            }
          >
            <Shield className="mr-2 size-4" />
            {COPY.GROUP_INFO_MAKE_ADMIN}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-wa-danger focus:text-wa-danger"
          onClick={() =>
            remove.mutate(member.userId, {
              onError: (err) =>
                toast.error(err.response?.data?.error ?? "Failed"),
            })
          }
        >
          <UserMinus className="mr-2 size-4" />
          {COPY.GROUP_INFO_REMOVE}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Pretty-print the stored phone (international form). We only have a
// single string column; do a best-effort space-out so it looks closer
// to "+92 333 8048724".
function formatPhone(phone) {
  if (!phone) return null;
  const trimmed = String(phone).trim();
  if (trimmed.length < 6) return trimmed;
  if (trimmed.startsWith("+92") && trimmed.length === 13) {
    return `${trimmed.slice(0, 3)} ${trimmed.slice(3, 6)} ${trimmed.slice(6)}`;
  }
  return trimmed;
}
