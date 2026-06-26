"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationsQuery } from "@/tanstack/notifications/queries";
import { useMarkAllNotificationsReadMutation } from "@/tanstack/notifications/mutations";
import { COPY } from "@/config/constants";

import { NotificationItem } from "./notification-item";

// Inbox body shared by the desktop popover + the mobile sheet wrappers.
// `scrollHeight` lets the caller tune the scroll area (popover is short,
// the mobile sheet fills the screen).
export function NotificationsHubBody({ onAfterItemClick, scrollHeight = "h-80" }) {
  const { data, isLoading } = useNotificationsQuery();
  const markAll = useMarkAllNotificationsReadMutation();
  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  return (
    <>
      <div className="flex items-center justify-between border-b border-wa-border px-4 py-3">
        <h2 className="text-sm font-medium text-wa-text">
          {COPY.NOTIFICATIONS_TITLE}
        </h2>
        <Button
          size="xs"
          variant="ghost"
          disabled={unread === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
          className="text-xs text-wa-text-muted hover:text-wa-text"
        >
          {COPY.NOTIFICATIONS_MARK_ALL_READ}
        </Button>
      </div>

      <ScrollArea className={scrollHeight}>
        {isLoading ? (
          <div className="flex justify-center py-6 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
            {COPY.NOTIFICATIONS_EMPTY}
          </p>
        ) : (
          items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onAfterClick={onAfterItemClick}
            />
          ))
        )}
      </ScrollArea>
    </>
  );
}
