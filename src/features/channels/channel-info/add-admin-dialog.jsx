"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEligibleContactsQuery } from "@/tanstack/users/queries";
import { useAddChannelAdminMutation } from "@/tanstack/channels/mutations";
import { CHANNEL_MAX_ADMINS } from "@/config/constants";
import { cn } from "@/utils/cn";

// "Invite admins" picker. Single-select — we add one admin at a time
// because the cap is small (5) and the mutation is one-by-one anyway.
// Filters out users who are already admins so we never offer a noop.
export function AddChannelAdminDialog({
  open,
  onOpenChange,
  channelId,
  existingAdminIds = [],
  remainingSlots,
}) {
  const { data: contacts, isLoading } = useEligibleContactsQuery({
    enabled: open,
  });
  const add = useAddChannelAdminMutation(channelId);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (open) {
      setPicked(null);
      setQuery("");
    }
  }, [open]);

  const existingSet = useMemo(
    () => new Set(existingAdminIds),
    [existingAdminIds],
  );

  const filtered = useMemo(() => {
    const list = (contacts ?? []).filter((c) => !existingSet.has(c.id));
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [contacts, existingSet, query]);

  const onSave = async () => {
    if (!picked) return;
    try {
      await add.mutateAsync(picked);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to add admin");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[75vh] max-h-[560px] w-[92vw] max-w-md flex-col gap-0 overflow-hidden border-wa-border bg-wa-panel p-0 text-wa-text"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-wa-border bg-wa-panel-2 px-3 py-3">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="text-wa-text-muted hover:text-wa-text"
          >
            <X className="size-4" />
          </Button>
          <DialogTitle className="flex-1 text-sm font-medium text-wa-text">
            Invite admin
          </DialogTitle>
          <DialogDescription className="sr-only">
            Pick a friend to promote to channel admin.
          </DialogDescription>
          <span className="text-xs text-wa-text-muted">
            {remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left
          </span>
        </div>

        <div className="shrink-0 px-3 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your friends"
              className="border-0 bg-wa-panel-2 pl-9"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-10 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-wa-text-muted">
              No eligible friends. Send a friend request first.
            </p>
          ) : (
            <ul className="flex flex-col">
              {filtered.map((c) => {
                const selected = picked === c.id;
                const initials = (c.name ?? "??").slice(0, 2).toUpperCase();
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setPicked(selected ? null : c.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-wa-panel-2",
                        selected && "bg-wa-panel-2/60",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full border-2",
                          selected
                            ? "border-wa-green bg-wa-green text-white"
                            : "border-wa-text-muted/60",
                        )}
                      >
                        {selected && <Check className="size-3" />}
                      </span>
                      <Avatar className="size-10">
                        <AvatarImage src={c.avatar ?? undefined} alt={c.name} />
                        <AvatarFallback className="bg-wa-panel-3 text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm text-wa-text">
                          {c.name}
                        </span>
                        {c.handle && (
                          <span className="truncate text-xs text-wa-text-muted">
                            @{c.handle}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-wa-border bg-wa-panel-2 px-4 py-3">
          <span className="text-xs text-wa-text-muted">
            Max {CHANNEL_MAX_ADMINS} admins per channel.
          </span>
          <Button
            size="sm"
            onClick={onSave}
            disabled={!picked || add.isPending}
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            {add.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Add admin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
