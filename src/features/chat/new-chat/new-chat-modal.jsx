"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFriendsQuery } from "@/tanstack/friend-requests/queries";
import { useStartChatMutation } from "@/tanstack/chat/mutations";
import { COPY, ROUTES } from "@/config/constants";

// Friend-gated new-chat picker. Only accepted friends show up; if the
// current user has no friends yet, we point them at /search to send a
// friend request first.
export function NewChatModal({ open, onOpenChange }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: friends = [], isLoading } = useFriendsQuery();
  const start = useStartChatMutation();

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((p) =>
      [p.name, p.handle, p.email, p.phone]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [friends, search]);

  const onPick = (peer) => {
    start.mutate(peer.id, {
      onSuccess: (chat) => {
        onOpenChange(false);
        router.push(ROUTES.CHAT_DETAIL(chat.id));
      },
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Could not start chat"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{COPY.NEW_CHAT_TITLE}</DialogTitle>
          <DialogDescription>
            Pick one of your friends to start chatting.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter friends"
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="h-72 px-2 py-2">
          {isLoading ? (
            <div className="flex justify-center py-6 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
              You don&apos;t have any friends yet. Find someone to add.
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-wa-text-muted">
              No friends match your filter.
            </p>
          ) : (
            filtered.map((peer) => (
              <button
                key={peer.id}
                type="button"
                onClick={() => onPick(peer)}
                disabled={start.isPending}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-wa-panel-2 disabled:opacity-50"
              >
                <Avatar className="size-10">
                  <AvatarImage src={peer.avatar ?? undefined} alt={peer.name} />
                  <AvatarFallback className="bg-wa-panel-3 text-xs">
                    {(peer.name ?? "??").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-wa-text">
                    {peer.name}
                  </span>
                  <span className="truncate text-xs text-wa-text-muted">
                    {peer.handle ? `@${peer.handle}` : peer.email ?? peer.phone ?? "—"}
                  </span>
                </div>
              </button>
            ))
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4">
          <Button asChild variant="secondary" onClick={() => onOpenChange(false)}>
            <Link href={ROUTES.SEARCH_PAGE}>
              <UserPlus className="mr-2 size-4" />
              Find new friends
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
