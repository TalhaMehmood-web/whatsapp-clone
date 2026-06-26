"use client";

import Link from "next/link";
import { Eye, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStatusViewersQuery } from "@/tanstack/status/queries";
import { ROUTES } from "@/config/constants";

// Author-only sheet listing the friends who have watched a given status.
// We mount it lazily — only fetch viewers when the sheet is actually open.
export function StatusViewersSheet({ statusId, open, onOpenChange }) {
  const { data, isLoading } = useStatusViewersQuery(statusId, { enabled: open });
  const viewers = data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[70vh] rounded-t-2xl border-wa-border bg-wa-panel text-wa-text"
      >
        <SheetHeader className="flex-row items-center gap-2 space-y-0 pb-2 text-left">
          <Eye className="size-4 text-wa-text-muted" />
          <SheetTitle className="text-base font-medium text-wa-text">
            Viewed by{" "}
            <span className="text-wa-text-muted">{viewers.length}</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="max-h-[55vh]">
          {isLoading ? (
            <div className="flex justify-center py-10 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : viewers.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-wa-text-muted">
              Nobody has seen this status yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {viewers.map((v) => (
                <ViewerRow key={v.id} view={v} />
              ))}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function ViewerRow({ view }) {
  const u = view.user;
  const initials = (u?.name ?? u?.handle ?? "??").slice(0, 2).toUpperCase();
  return (
    <li>
      <Link
        href={u?.handle ? ROUTES.PROFILE(u.handle) : "#"}
        className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-wa-panel-2"
      >
        <Avatar className="size-9">
          <AvatarImage src={u?.avatar ?? undefined} alt={u?.name} />
          <AvatarFallback className="bg-wa-panel-3 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm text-wa-text">{u?.name}</span>
          {u?.handle && (
            <span className="truncate text-xs text-wa-text-muted">
              @{u.handle}
            </span>
          )}
        </div>
        <span className="shrink-0 text-[11px] text-wa-text-muted">
          {formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true })}
        </span>
      </Link>
    </li>
  );
}
