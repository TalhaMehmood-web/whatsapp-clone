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
import { useAddCommunityMembersMutation } from "@/tanstack/communities/mutations";
import {
  COMMUNITY_MAX_MEMBERS,
  COPY,
} from "@/config/constants";
import { cn } from "@/utils/cn";

// Friend-picker for the community "Add members" action. Mirrors the
// privacy exception picker — same Dialog layout, same selection model
// — so users don't have to learn two different patterns for "pick some
// contacts". Existing members are pre-filtered out of the list so the
// user can't try to add them twice.
//
// 50-cap is enforced both server-side (the mutation will 413) and
// client-side here so we can show a helpful counter as the user
// selects, not just at submit.
export function AddCommunityMembersDialog({
  open,
  onOpenChange,
  communityId,
  existingMemberIds = [],
}) {
  const { data: contacts, isLoading } = useEligibleContactsQuery({
    enabled: open,
  });
  const add = useAddCommunityMembersMutation(communityId);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    if (open) setSelected(new Set());
    if (!open) setQuery("");
  }, [open]);

  // Strip current members so the picker can never queue a duplicate
  // — Prisma's unique constraint would catch it, but a clean UX is
  // better than a 409 from the server.
  const existingSet = useMemo(
    () => new Set(existingMemberIds),
    [existingMemberIds],
  );

  const filtered = useMemo(() => {
    const list = (contacts ?? []).filter((c) => !existingSet.has(c.id));
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [contacts, existingSet, query]);

  const remaining = COMMUNITY_MAX_MEMBERS - existingMemberIds.length;
  const atLimit = selected.size >= remaining;

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < remaining) {
        next.add(id);
      } else {
        toast.info(COPY.COMMUNITIES_CAP_MEMBERS(COMMUNITY_MAX_MEMBERS));
      }
      return next;
    });

  const onSave = async () => {
    if (selected.size === 0) {
      onOpenChange(false);
      return;
    }
    try {
      await add.mutateAsync(Array.from(selected));
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to add members");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[80vh] max-h-[640px] w-[92vw] max-w-md flex-col gap-0 overflow-hidden border-wa-border bg-wa-panel p-0 text-wa-text"
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
            {COPY.COMMUNITIES_ADD_MEMBERS}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {COPY.COMMUNITIES_ADD_MEMBERS}
          </DialogDescription>
          <span className="text-xs text-wa-text-muted">
            {selected.size}/{remaining}
          </span>
        </div>

        <div className="shrink-0 px-3 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={COPY.PRIVACY_EXCEPT_SEARCH}
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
              {COPY.PRIVACY_EXCEPT_NONE}
            </p>
          ) : (
            <ul className="flex flex-col">
              {filtered.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  checked={selected.has(c.id)}
                  disabled={atLimit && !selected.has(c.id)}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-wa-border bg-wa-panel-2 px-4 py-3">
          <span className="text-xs text-wa-text-muted">
            {COPY.COMMUNITIES_CAP_MEMBERS(COMMUNITY_MAX_MEMBERS)}
          </span>
          <Button
            size="icon"
            onClick={onSave}
            disabled={add.isPending || selected.size === 0}
            aria-label="Add"
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            {add.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Check className="size-5" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContactRow({ contact, checked, disabled, onToggle }) {
  const initials = (contact.name ?? "??").slice(0, 2).toUpperCase();
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-wa-panel-2",
          disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
        )}
      >
        <span
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-sm border-2 transition-colors",
            checked
              ? "border-wa-green bg-wa-green text-white"
              : "border-wa-text-muted/60",
          )}
          aria-hidden
        >
          {checked && <Check className="size-3" />}
        </span>
        <Avatar className="size-10">
          <AvatarImage src={contact.avatar ?? undefined} alt={contact.name} />
          <AvatarFallback className="bg-wa-panel-3 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm text-wa-text">{contact.name}</span>
          {contact.about && (
            <span className="truncate text-xs text-wa-text-muted">
              {contact.about}
            </span>
          )}
        </div>
      </button>
    </li>
  );
}
