"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Circle, MessageSquare, Search, Settings } from "lucide-react";

import { NotificationsHub } from "@/features/notifications/notifications-hub/notifications-hub";
import { COPY, ROUTES } from "@/config/constants";
import { cn } from "@/utils/cn";

import { MoreMenuSheet } from "./more-menu-sheet";

// Mobile-only bottom tab bar. Hidden at md+ (where the side NavRail takes
// over). Five primary destinations + a notifications popover + an
// always-visible "More" sheet so the user can reach any remaining
// surface (Calls, Channels, Communities, Friend requests, Archived,
// Saved, Meta AI, Profile, Theme, Log out) without leaving the page.
//
// The slot order matches WhatsApp's mobile app: most-used left, status-y
// surfaces middle, settings-y surfaces right. Each slot gets ~16% width
// (we use flex-1 so the bar still adapts to weird viewport widths).
const LINK_TABS = [
  { href: ROUTES.CHAT_INDEX, label: COPY.NAV_CHATS, icon: MessageSquare },
  { href: ROUTES.STATUS, label: COPY.NAV_STATUS, icon: Circle },
  { href: ROUTES.SEARCH_PAGE, label: COPY.NAV_SEARCH, icon: Search },
  { href: ROUTES.SETTINGS, label: COPY.NAV_SETTINGS, icon: Settings },
];

export function BottomTabBar() {
  const pathname = usePathname() ?? "";

  // Detail screens (e.g. /chat/[id], /settings/profile) leave room for
  // the chat input or detail content, so we hide the bar there. Same
  // heuristic the SplitPane uses to decide which pane is visible on
  // mobile (anything with 2+ URL segments is detail mode).
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);
  if (segments.length >= 2) return null;

  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className="sticky bottom-0 z-30 flex h-14 shrink-0 border-t border-wa-border bg-wa-panel md:hidden"
      aria-label="Primary"
    >
      {LINK_TABS.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px]",
              active ? "text-wa-green" : "text-wa-text-muted",
            )}
          >
            <tab.icon className="size-5 shrink-0" />
            <span className="block w-full truncate text-center">
              {tab.label}
            </span>
          </Link>
        );
      })}

      {/* Notifications uses an in-place sheet rather than navigating.
          The hub component handles the desktop popover / mobile sheet
          split internally; `compact` flattens its trigger to match the
          link-tab styling. */}
      <NotificationsHub compact />

      {/* Permanent "More" trigger. Hosts everything that didn't make
          the cut for the primary five — Calls, Channels, Communities,
          Friend requests, Archived, Saved, Meta AI, Profile, theme
          toggle, log out. */}
      <MoreMenuSheet />
    </nav>
  );
}
