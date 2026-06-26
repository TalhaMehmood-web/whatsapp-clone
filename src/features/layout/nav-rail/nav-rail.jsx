"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  Circle,
  MessageSquare,
  Phone,
  Radio,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useIncomingFriendRequestsQuery } from "@/tanstack/friend-requests/queries";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { NotificationsHub } from "@/features/notifications/notifications-hub/notifications-hub";
import { COPY, ROUTES } from "@/config/constants";
import { NavRailItem } from "./nav-rail-item";

const PRIMARY = [
  { href: ROUTES.CHAT_INDEX, label: COPY.NAV_CHATS, icon: MessageSquare },
  { href: ROUTES.STATUS, label: COPY.NAV_STATUS, icon: Circle },
  { href: ROUTES.CALLS, label: COPY.NAV_CALLS, icon: Phone },
  { href: ROUTES.CHANNELS, label: COPY.NAV_CHANNELS, icon: Radio },
  { href: ROUTES.COMMUNITIES, label: COPY.NAV_COMMUNITIES, icon: Users },
];

const SECONDARY = [
  { href: ROUTES.ARCHIVED, label: COPY.NAV_ARCHIVED, icon: Archive },
];

export function NavRail() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: incoming } = useIncomingFriendRequestsQuery();
  const incomingCount = incoming?.length ?? 0;

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="hidden h-full w-16 shrink-0 flex-col items-center gap-1 border-r border-wa-border bg-wa-panel py-3 md:flex">
      {PRIMARY.map((item) => (
        <NavRailItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActive(item.href)}
        />
      ))}

      <Separator className="my-1 w-8 bg-wa-border" />

      <NavRailItem
        href={ROUTES.SEARCH_PAGE}
        label={COPY.NAV_SEARCH}
        icon={Search}
        active={isActive(ROUTES.SEARCH_PAGE)}
      />
      <NavRailItem
        href={ROUTES.REQUESTS}
        label={COPY.NAV_REQUESTS}
        icon={UserPlus}
        active={isActive(ROUTES.REQUESTS)}
        badge={incomingCount}
      />
      <NotificationsHub />

      <Separator className="my-1 w-8 bg-wa-border" />

      <NavRailItem
        href={ROUTES.META_AI}
        label={COPY.NAV_META_AI}
        icon={Sparkles}
        active={isActive(ROUTES.META_AI)}
      />

      <div className="flex-1" />

      {SECONDARY.map((item) => (
        <NavRailItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActive(item.href)}
        />
      ))}

      <ThemeToggle className="size-11 rounded-lg text-wa-text-muted hover:bg-wa-panel-2 hover:text-wa-text" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={ROUTES.SETTINGS_PROFILE}
            aria-label={COPY.NAV_PROFILE}
            className="mt-1 rounded-full ring-offset-wa-panel transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-green"
          >
            <Avatar className="size-9">
              <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
              <AvatarFallback className="bg-wa-panel-3 text-xs text-wa-text">
                {user?.name?.slice(0, 2)?.toUpperCase() ?? "ME"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {COPY.NAV_PROFILE}
        </TooltipContent>
      </Tooltip>
    </nav>
  );
}
