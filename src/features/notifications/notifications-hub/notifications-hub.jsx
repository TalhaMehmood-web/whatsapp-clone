"use client";

import { forwardRef, useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useNotificationsQuery } from "@/tanstack/notifications/queries";
import { COPY } from "@/config/constants";
import { cn } from "@/utils/cn";

import { NotificationsHubBody } from "./notifications-hub-body";

// Bell + count badge. Renders the inbox in a popover on desktop and a
// bottom sheet on mobile so it stays one-tap reachable on small screens.
//
// `compact` swaps the chunky 44px nav-rail button for a bottom-bar style
// trigger (used by the mobile tab bar). Both variants share the badge + body.
export function NotificationsHub({ compact = false }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { data } = useNotificationsQuery();
  const unread = data?.unread ?? 0;

  const trigger = compact ? (
    <CompactTrigger unread={unread} active={open} />
  ) : (
    <RailTrigger unread={unread} active={open} />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="flex h-[80dvh] flex-col p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{COPY.NOTIFICATIONS_TITLE}</SheetTitle>
          </SheetHeader>
          <NotificationsHubBody
            scrollHeight="flex-1"
            onAfterItemClick={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {COPY.NAV_NOTIFICATIONS}
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-80 max-w-[90vw] p-0"
      >
        <NotificationsHubBody onAfterItemClick={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

// Square 44×44 button for the desktop nav rail. forwardRef + props spread
// is required so Radix Popover/Sheet asChild can wire up onClick + ref.
const RailTrigger = forwardRef(function RailTrigger(
  { unread, active, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      aria-label={COPY.NAV_NOTIFICATIONS}
      className={cn(
        "relative size-11 rounded-lg text-wa-text-muted hover:bg-wa-panel-2 hover:text-wa-text",
        active && "bg-wa-panel-3 text-wa-text",
      )}
      {...props}
    >
      <Bell className="size-6" />
      <UnreadBadge unread={unread} corner />
    </Button>
  );
});

// Tab-bar style trigger for the mobile bottom bar. `flex-1` shares slot
// width evenly with the surrounding tabs — no `max-w-` because the
// bottom bar is now a 6-slot layout (5 link tabs + More sheet) and we
// want each slot to claim the same fraction.
const CompactTrigger = forwardRef(function CompactTrigger(
  { unread, active, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={COPY.NAV_NOTIFICATIONS}
      className={cn(
        "relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px]",
        active ? "text-wa-green" : "text-wa-text-muted",
      )}
      {...props}
    >
      <Bell className="size-5 shrink-0" />
      <span className="block w-full truncate text-center">
        {COPY.NAV_NOTIFICATIONS}
      </span>
      <UnreadBadge unread={unread} compact />
    </button>
  );
});

function UnreadBadge({ unread, corner, compact }) {
  if (unread <= 0) return null;
  const text = unread > 99 ? "99+" : unread;
  if (compact) {
    return (
      <span className="absolute right-[18%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-wa-green px-1 text-[10px] font-medium text-white">
        {text}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-wa-green px-1 text-[10px] font-medium text-white",
        corner ? "right-1 top-1" : "-right-1 -top-1",
      )}
    >
      {text}
    </span>
  );
}
