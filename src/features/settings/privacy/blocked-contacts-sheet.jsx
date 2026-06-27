"use client";

import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

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
import { useBlockedUsersQuery } from "@/tanstack/users/queries";
import { useUnblockUserMutation } from "@/tanstack/users/mutations";
import { COPY } from "@/config/constants";

export function BlockedContactsSheet({ open, onOpenChange }) {
  const { data, isLoading } = useBlockedUsersQuery();
  const unblock = useUnblockUserMutation();
  const blocked = data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        <SheetHeader className="px-6 pb-3 pt-6">
          <SheetTitle>{COPY.BLOCKED_CONTACTS}</SheetTitle>
          <SheetDescription>
            {COPY.BLOCKED_HEADER_DESCRIPTION}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : blocked.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
              {COPY.BLOCKED_EMPTY}
            </p>
          ) : (
            blocked.map((peer) => (
              <div
                key={peer.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-wa-panel-2"
              >
                <Avatar className="size-10">
                  <AvatarImage src={peer.avatar ?? undefined} alt={peer.name} />
                  <AvatarFallback className="bg-wa-panel-3 text-xs">
                    {(peer.name ?? "??").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm text-wa-text">
                    {peer.name}
                  </span>
                  <span className="truncate text-xs text-wa-text-muted">
                    {peer.about ?? peer.phone ?? peer.email ?? "—"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    unblock.mutate(peer.id, {
                      onError: (err) =>
                        toast.error(
                          err.response?.data?.error ?? "Failed to unblock",
                        ),
                    })
                  }
                  loading={unblock.isPending}
                  className="text-wa-text-muted hover:text-wa-text"
                >
                  <X className="mr-1 size-4" />
                  {COPY.UNBLOCK}
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
