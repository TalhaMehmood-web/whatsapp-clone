"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  ChevronRight,
  LogOut,
  MoreHorizontal,
  Phone,
  Radio,
  Sparkles,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useIncomingFriendRequestsQuery } from "@/tanstack/friend-requests/queries";
import { useLogoutMutation } from "@/tanstack/auth/mutations";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { COPY, ROUTES } from "@/config/constants";
import { cn } from "@/utils/cn";

// The "More" sheet at the right edge of the mobile bottom bar. Lists
// every navigation surface that didn't make the cut for the 5 primary
// tabs (Chats, Status, Find people, Settings, Notifications). Anything
// reachable from the desktop NavRail's secondary cluster — Calls,
// Channels, Communities, Friend requests, Archived, Meta AI, Saved
// (Starred), Profile — has a row here.
//
// Tapping any row closes the sheet via SheetTrigger's controlled state +
// router.push so navigation feels instant on phones.
export function MoreMenuSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user } = useAuth();
  const { data: incoming } = useIncomingFriendRequestsQuery();
  const { mutate: logout } = useLogoutMutation();
  const incomingCount = incoming?.length ?? 0;

  // The bar itself decides whether to mount us. Inside the sheet we
  // just dim the row matching the current pathname so users see where
  // they came from when they swipe between sections.
  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const navigate = (href) => {
    setOpen(false);
    router.push(href);
  };

  const rows = [
    {
      href: ROUTES.CALLS,
      label: COPY.NAV_CALLS,
      icon: Phone,
    },
    {
      href: ROUTES.CHANNELS,
      label: COPY.NAV_CHANNELS,
      icon: Radio,
    },
    {
      href: ROUTES.COMMUNITIES,
      label: COPY.NAV_COMMUNITIES,
      icon: Users,
    },
    {
      href: ROUTES.REQUESTS,
      label: COPY.NAV_REQUESTS,
      icon: UserPlus,
      badge: incomingCount,
    },
    {
      href: ROUTES.STARRED,
      label: COPY.STARRED_MESSAGES,
      icon: Star,
    },
    {
      href: ROUTES.ARCHIVED,
      label: COPY.NAV_ARCHIVED,
      icon: Archive,
    },
    {
      href: ROUTES.META_AI,
      label: COPY.NAV_META_AI,
      icon: Sparkles,
    },
  ];

  const initials = (user?.name ?? "??").slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] text-wa-text-muted transition-colors hover:text-wa-text"
          aria-label={COPY.NAV_MORE}
        >
          <MoreHorizontal className="size-5 shrink-0" />
          <span className="block w-full truncate text-center">
            {COPY.NAV_MORE}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-t-2xl border-wa-border bg-wa-panel p-0 text-wa-text"
      >
        <SheetHeader className="border-b border-wa-border px-4 py-3 text-left">
          <SheetTitle className="text-base font-medium text-wa-text">
            {COPY.NAV_MORE_SHEET_TITLE}
          </SheetTitle>
          <SheetDescription className="text-xs text-wa-text-muted">
            {COPY.NAV_MORE_SHEET_DESC}
          </SheetDescription>
        </SheetHeader>

        {/* Profile row at the top — matches the avatar slot on the
            desktop nav rail so users have a single mental model. */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.SETTINGS_PROFILE)}
          className="flex items-center gap-3 border-b border-wa-border bg-wa-panel-2/40 px-4 py-3 text-left transition-colors hover:bg-wa-panel-2"
        >
          <Avatar className="size-10">
            <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
            <AvatarFallback className="bg-wa-panel-3 text-xs text-wa-text">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-wa-text">
              {user?.name ?? COPY.NAV_PROFILE}
            </span>
            {user?.handle && (
              <span className="truncate text-xs text-wa-text-muted">
                @{user.handle}
              </span>
            )}
          </div>
          <ChevronRight className="size-4 text-wa-text-muted" />
        </button>

        <ul className="flex-1 overflow-y-auto py-1">
          {rows.map((row) => (
            <li key={row.href}>
              <button
                type="button"
                onClick={() => navigate(row.href)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-wa-panel-2",
                  isActive(row.href) && "bg-wa-panel-2/60",
                )}
              >
                <row.icon className="size-5 shrink-0 text-wa-text-muted" />
                <span className="flex-1 text-sm text-wa-text">{row.label}</span>
                {row.badge ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-wa-green px-1.5 text-[10px] font-medium text-white">
                    {row.badge > 9 ? "9+" : row.badge}
                  </span>
                ) : (
                  <ChevronRight className="size-4 text-wa-text-muted" />
                )}
              </button>
            </li>
          ))}
        </ul>

        <Separator className="bg-wa-border" />

        {/* Theme + logout sit at the bottom of the sheet — same
            relative position as the desktop nav rail. */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <ThemeToggle className="size-10 rounded-lg text-wa-text-muted hover:bg-wa-panel-2 hover:text-wa-text" />
          <button
            type="button"
            onClick={() =>
              logout(undefined, {
                onSuccess: () => router.replace(ROUTES.LOGIN),
              })
            }
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-wa-danger transition-colors hover:bg-wa-panel-2"
          >
            <LogOut className="size-4" />
            {COPY.LOG_OUT}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
