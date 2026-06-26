"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Circle, MessageSquare, Search, UserPlus } from "lucide-react";

import { useIncomingFriendRequestsQuery } from "@/tanstack/friend-requests/queries";
import { NotificationsHub } from "@/features/notifications/notifications-hub/notifications-hub";
import { COPY, ROUTES } from "@/config/constants";
import { cn } from "@/utils/cn";

// Mobile-only bottom tab bar. Hidden at md+ (where the side NavRail takes
// over). The tabs mirror the most important primary nav items + the friend
// requests entry with a count badge + the notifications bell sheet.
const LINK_TABS = [
  { href: ROUTES.CHAT_INDEX, label: COPY.NAV_CHATS, icon: MessageSquare },
  { href: ROUTES.STATUS, label: COPY.NAV_STATUS, icon: Circle },
  { href: ROUTES.SEARCH_PAGE, label: COPY.NAV_SEARCH, icon: Search },
  {
    href: ROUTES.REQUESTS,
    label: COPY.NAV_REQUESTS,
    icon: UserPlus,
    badgeKey: "requests",
  },
];

export function BottomTabBar() {
  const pathname = usePathname() ?? "";
  const { data: incoming } = useIncomingFriendRequestsQuery();
  const incomingCount = incoming?.length ?? 0;
  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Detail screens (eg /chat/[id]) should leave room for the chat input,
  // so we hide the bottom bar there. Same heuristic the SplitPane uses.
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);
  if (segments.length >= 2) return null;

  return (
    <nav
      className="sticky bottom-0 z-30 flex h-14 shrink-0 border-t border-wa-border bg-wa-panel md:hidden"
      aria-label="Primary"
    >
      {LINK_TABS.map((tab) => {
        const active = isActive(tab.href);
        const badge = tab.badgeKey === "requests" ? incomingCount : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex min-w-0 max-w-[20%] flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px]",
              active ? "text-wa-green" : "text-wa-text-muted",
            )}
          >
            <tab.icon className="size-5 shrink-0" />
            <span className="block w-full truncate text-center">
              {tab.label}
            </span>
            {badge > 0 && (
              <span className="absolute right-[18%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-wa-green px-1 text-[10px] font-medium text-white">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </Link>
        );
      })}
      <NotificationsHub compact />
    </nav>
  );
}
