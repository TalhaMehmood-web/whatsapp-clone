"use client";

import Link from "next/link";
import {
  Bell,
  Check,
  PhoneMissed,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMarkNotificationReadMutation } from "@/tanstack/notifications/mutations";
import { chatListTime } from "@/utils/date-format";
import { ROUTES } from "@/config/constants";
import { NotificationKind } from "@/models/enums";
import { cn } from "@/utils/cn";

const ICON_BY_KIND = {
  [NotificationKind.FRIEND_REQUEST]: UserPlus,
  [NotificationKind.FRIEND_REQUEST_ACCEPTED]: Check,
  [NotificationKind.GROUP_ADDED]: Users,
  [NotificationKind.GROUP_REMOVED]: UserMinus,
  [NotificationKind.MISSED_CALL]: PhoneMissed,
  [NotificationKind.SYSTEM]: Bell,
};

// One row in the notifications popover. Clicking it both marks the row
// read and deep-links to the relevant screen (e.g. /requests for a
// pending request).
export function NotificationItem({ notification, onAfterClick }) {
  const mark = useMarkNotificationReadMutation();
  const Icon = ICON_BY_KIND[notification.kind] ?? Bell;
  const unread = !notification.readAt;
  const data = notification.data ?? {};
  const avatar = pickAvatar(notification.kind, data);

  const href = deepLinkFor(notification);

  const handleClick = () => {
    if (unread) mark.mutate(notification.id);
    onAfterClick?.();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-wa-panel-2",
        unread && "bg-wa-panel-2/40",
      )}
    >
      {avatar ? (
        <Avatar
          className={cn(
            "size-9",
            // Group photos look better as a rounded square (matches the
            // community / group cards elsewhere in the app).
            notification.kind === NotificationKind.GROUP_ADDED && "rounded-md",
          )}
        >
          <AvatarImage src={avatar.src ?? undefined} alt={avatar.label} />
          <AvatarFallback
            className={cn(
              "bg-wa-panel-3 text-xs",
              notification.kind === NotificationKind.GROUP_ADDED && "rounded-md",
            )}
          >
            {(avatar.label ?? "??").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full bg-wa-panel-3 text-wa-text-muted",
            notification.kind === NotificationKind.GROUP_REMOVED &&
              "bg-wa-danger/10 text-wa-danger",
          )}
        >
          <Icon className="size-4" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-wa-text">
            {notification.title}
          </span>
          <span className="shrink-0 text-[11px] text-wa-text-muted">
            {chatListTime(notification.createdAt)}
          </span>
        </div>
        {notification.body && (
          <span className="truncate text-xs text-wa-text-muted">
            {notification.body}
          </span>
        )}
      </div>
      {unread && (
        <span
          className="mt-2 size-2 shrink-0 rounded-full bg-wa-green"
          aria-label="Unread"
        />
      )}
    </Link>
  );
}

// Choose the right thumbnail for a notification row. Friend kinds use the
// peer's avatar; group invites use the group photo. Returns `null` when
// there's nothing meaningful to render (the caller falls back to a kind
// icon).
function pickAvatar(kind, data) {
  if (kind === NotificationKind.GROUP_ADDED) {
    if (!data?.chatName && !data?.chatPhoto) return null;
    return { src: data.chatPhoto, label: data.chatName };
  }
  if (data?.peerAvatar || data?.peerName || data?.peerHandle) {
    return {
      src: data.peerAvatar,
      label: data.peerName ?? data.peerHandle,
    };
  }
  return null;
}

// Pick the most useful destination for a given notification kind. Friend
// requests prefer the requesting user's public profile (so the accept /
// decline buttons live next to the bio), and only fall back to the inbox
// when there's no handle on the payload.
function deepLinkFor(notification) {
  const handle = notification.data?.peerHandle;
  switch (notification.kind) {
    case NotificationKind.FRIEND_REQUEST:
      return handle ? ROUTES.PROFILE(handle) : ROUTES.REQUESTS;
    case NotificationKind.FRIEND_REQUEST_ACCEPTED:
      return handle ? ROUTES.PROFILE(handle) : ROUTES.CHAT_INDEX;
    case NotificationKind.GROUP_ADDED:
      return notification.data?.chatId
        ? ROUTES.CHAT_DETAIL(notification.data.chatId)
        : ROUTES.CHAT_INDEX;
    case NotificationKind.GROUP_REMOVED:
      return ROUTES.CHAT_INDEX;
    case NotificationKind.MISSED_CALL:
      return ROUTES.CALLS;
    default:
      return ROUTES.CHAT_INDEX;
  }
}
