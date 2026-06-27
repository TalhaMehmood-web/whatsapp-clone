"use client";

import { Loader2, Lock, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChannelSubscribersQuery } from "@/tanstack/channels/queries";

// Followers list with privacy gating (server-enforced). When the
// caller isn't an owner/admin, the server returns only the overlap of
// (channel subscribers) ∩ (caller's accepted friends) and stamps a
// `gated: true` flag — we surface that as a small footer hint so
// users understand they're not seeing the full count.
export function ChannelSubscribersSheet({ open, onOpenChange, channelId }) {
  const { data, isLoading } = useChannelSubscribersQuery(channelId, {
    enabled: open,
  });
  const subscribers = data?.subscribers ?? [];
  const gated = !!data?.gated;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-wa-border bg-wa-panel p-0 text-wa-text sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center gap-2 space-y-0 border-b border-wa-border px-3 py-3 text-left">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="text-wa-text-muted hover:text-wa-text"
          >
            <X className="size-4" />
          </Button>
          <SheetTitle className="flex-1 text-sm font-medium text-wa-text">
            Followers
          </SheetTitle>
          <SheetDescription className="sr-only">
            People who subscribe to this channel.
          </SheetDescription>
          <span className="text-xs text-wa-text-muted">
            {subscribers.length}
          </span>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-10 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : subscribers.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-wa-text-muted">
              {gated
                ? "None of your friends subscribe to this channel yet."
                : "No followers yet."}
            </p>
          ) : (
            <ul className="flex flex-col">
              {subscribers.map((u) => {
                const initials = (u.name ?? "??").slice(0, 2).toUpperCase();
                return (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={u.avatar ?? undefined} alt={u.name} />
                      <AvatarFallback className="bg-wa-panel-3 text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm text-wa-text">
                        {u.name ?? "—"}
                      </span>
                      {u.handle && (
                        <span className="truncate text-xs text-wa-text-muted">
                          @{u.handle}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        {gated && (
          <p className="flex items-start gap-2 border-t border-wa-border bg-wa-panel-2/40 px-4 py-3 text-xs leading-relaxed text-wa-text-muted">
            <Lock className="mt-0.5 size-3 shrink-0" />
            You can only view followers who are your friends or channel
            admins.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
