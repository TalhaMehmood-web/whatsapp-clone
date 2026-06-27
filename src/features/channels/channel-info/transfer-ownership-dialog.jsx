"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTransferChannelOwnershipMutation } from "@/tanstack/channels/mutations";
import { cn } from "@/utils/cn";

// Owner-only. Pick an existing admin to hand the channel to. We
// deliberately don't let the owner transfer to a non-admin — they'd
// need to promote them first. Keeps the action discoverable and
// prevents accidentally handing the channel to a near-stranger.
export function TransferOwnershipDialog({
  open,
  onOpenChange,
  channelId,
  admins = [],
}) {
  const transfer = useTransferChannelOwnershipMutation(channelId);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (open) setPicked(null);
  }, [open]);

  const onConfirm = async () => {
    if (!picked) return;
    try {
      await transfer.mutateAsync(picked);
      toast.success("Ownership transferred");
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to transfer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[60vh] max-h-[480px] w-[92vw] max-w-md flex-col gap-0 overflow-hidden border-wa-border bg-wa-panel p-0 text-wa-text"
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
            Transfer ownership
          </DialogTitle>
          <DialogDescription className="sr-only">
            Pick an admin to become the new owner. This can't be undone.
          </DialogDescription>
        </div>

        <p className="border-b border-wa-border px-4 py-3 text-xs text-wa-text-muted">
          The new owner can delete the channel, change privacy, and add
          admins. You'll be demoted to admin.
        </p>

        <ScrollArea className="min-h-0 flex-1">
          {admins.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-wa-text-muted">
              Add at least one admin before transferring ownership.
            </p>
          ) : (
            <ul className="flex flex-col">
              {admins.map((a) => {
                const selected = picked === a.id;
                const initials = (a.name ?? "??").slice(0, 2).toUpperCase();
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setPicked(selected ? null : a.id)}
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
                        <AvatarImage src={a.avatar ?? undefined} alt={a.name} />
                        <AvatarFallback className="bg-wa-panel-3 text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm text-wa-text">
                          {a.name}
                        </span>
                        {a.handle && (
                          <span className="truncate text-xs text-wa-text-muted">
                            @{a.handle}
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

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-wa-border bg-wa-panel-2 px-4 py-3">
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={!picked || transfer.isPending}
            className="bg-wa-danger text-white hover:bg-wa-danger/90"
          >
            {transfer.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Crown className="mr-2 size-4" />
            )}
            Transfer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
