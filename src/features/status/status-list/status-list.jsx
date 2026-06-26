"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Loader2,
  Lock,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";
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
import { useStatusFeedQuery } from "@/tanstack/status/queries";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/stores/ui-store";
import { queryKeys } from "@/config/query-keys";
import { COPY, ROUTES } from "@/config/constants";
import { statusTime } from "@/utils/date-format";
import { StatusListItem } from "./status-list-item";
import { StatusRingAvatar } from "./status-ring-avatar";

export function StatusList() {
  const router = useRouter();
  const qc = useQueryClient();
  const pushSettingsPane = useUiStore((s) => s.pushSettingsPane);
  const { data, isLoading } = useStatusFeedQuery();
  const { user } = useAuth();

  const newText = () => router.push(`${ROUTES.STATUS}/new?type=text`);
  const newMedia = () => router.push(`${ROUTES.STATUS}/new?type=media`);

  // 3-dot menu actions. "Status privacy" jumps to the existing Privacy
  // pane (the "Status" visibility row is already there). "Refresh"
  // re-fetches the status feed — the query is staleTime: Infinity so a
  // manual refetch is the only way to pick up something added on
  // another device.
  const openPrivacy = () => {
    router.push(ROUTES.SETTINGS);
    pushSettingsPane("privacy:status");
  };
  const refreshFeed = () =>
    qc.invalidateQueries({ queryKey: queryKeys.status.list });

  const mine = data?.mine ?? [];
  const contacts = data?.contacts ?? [];
  const recent = contacts.filter((c) => !c.allViewed);
  const viewed = contacts.filter((c) => c.allViewed);

  // When I have my own statuses, "My status" links to the viewer at /status/me
  // (a synthetic id the viewer recognises). When I don't, it opens the
  // composer. The small "+" badge always opens the composer.
  const myStatusHref =
    mine.length > 0 ? `${ROUTES.STATUS}/me` : `${ROUTES.STATUS}/new`;
  const latestMine = mine[0];

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-wa-text">
          {COPY.STATUS_TITLE}
        </h1>
        <div className="flex items-center gap-1 text-wa-text-muted">
          {/* `+` opens a tiny menu so the user can pick text vs
              photo/video on mobile. The desktop empty-pane keeps the
              two big buttons — this is the parity affordance for small
              screens that don't see that pane. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={COPY.STATUS_NEW_MENU_LABEL}
                className="hover:text-wa-text"
              >
                <Plus className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={newText}>
                <Pencil className="mr-2 size-4" /> {COPY.STATUS_TEXT_BUTTON}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={newMedia}>
                <Camera className="mr-2 size-4" /> {COPY.STATUS_MEDIA_BUTTON}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3-dot menu. Was a dead button — now opens the same actions
              the desktop overflow would. */}
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
              <DropdownMenuItem onClick={openPrivacy}>
                <Lock className="mr-2 size-4" /> {COPY.STATUS_MENU_PRIVACY}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={refreshFeed}>
                <RefreshCw className="mr-2 size-4" /> {COPY.STATUS_MENU_REFRESH}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <Link
          href={myStatusHref}
          className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-wa-panel-2"
        >
          <div className="relative">
            {mine.length > 0 ? (
              <StatusRingAvatar
                src={user?.avatar}
                name={user?.name}
                segments={mine.length}
                viewedCount={mine.length} /* my own posts are always "viewed" */
              />
            ) : (
              <Avatar className="size-12">
                <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
                <AvatarFallback className="bg-wa-panel-3 text-sm">
                  {(user?.name ?? "??").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            {/* The little + badge over the avatar opens the same picker
                as the header + so the user can choose text vs media
                without leaving the list. stopPropagation prevents the
                outer Link from also navigating to the viewer. */}
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <button
                  type="button"
                  aria-label={COPY.STATUS_NEW_MENU_LABEL}
                  className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-wa-panel bg-wa-green"
                >
                  <Plus className="size-3 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={newText}>
                  <Pencil className="mr-2 size-4" /> {COPY.STATUS_TEXT_BUTTON}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={newMedia}>
                  <Camera className="mr-2 size-4" /> {COPY.STATUS_MEDIA_BUTTON}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm text-wa-text">
              {COPY.STATUS_MY}
            </span>
            <span className="truncate text-xs text-wa-text-muted">
              {mine.length === 0
                ? COPY.STATUS_MY_HINT
                : statusTime(latestMine.createdAt)}
            </span>
          </div>
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-6 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <>
            {recent.length > 0 && (
              <>
                <SectionLabel>{COPY.STATUS_RECENT}</SectionLabel>
                {recent.map((c) => (
                  <StatusListItem key={c.user.id} contact={c} />
                ))}
              </>
            )}
            {viewed.length > 0 && (
              <>
                <SectionLabel>{COPY.STATUS_VIEWED}</SectionLabel>
                {viewed.map((c) => (
                  <StatusListItem key={c.user.id} contact={c} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-wa-text-muted">
      {children}
    </div>
  );
}
