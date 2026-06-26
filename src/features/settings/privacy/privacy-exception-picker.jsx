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
import { useUpdatePrivacyExceptionsMutation } from "@/tanstack/users/mutations";
import { COPY } from "@/config/constants";
import { cn } from "@/utils/cn";

// Multi-select contact picker shown when the user picks "My contacts
// except…" on a Privacy row. Layout mirrors WhatsApp Web:
// - title bar with close + done buttons
// - search input
// - "Contacts" group label
// - one ListRow per friend, with a green-square checkbox on the left
// - sticky footer pill with "N contacts excluded" + green confirm
//
// The same component is reused for every field — caller passes `field`
// (lastSeen / profilePhoto / about / status / groupsPolicy) and the
// `title` to display in the header.
export function PrivacyExceptionPicker({
  open,
  onOpenChange,
  field,
  title,
  initialExcludedIds = [],
}) {
  const { data: contacts, isLoading } = useEligibleContactsQuery({
    enabled: open,
  });
  const update = useUpdatePrivacyExceptionsMutation();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set(initialExcludedIds));

  // Reset local selection whenever the picker is reopened so we always
  // start from the canonical server-side value.
  useEffect(() => {
    if (open) setSelected(new Set(initialExcludedIds));
    if (!open) setQuery("");
    // initialExcludedIds is intentionally excluded from deps — the picker
    // owns its draft once it's open; the parent only seeds it on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    const list = contacts ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [contacts, query]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    try {
      await update.mutateAsync({
        field,
        excludedIds: Array.from(selected),
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to save");
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
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={COPY.PRIVACY_EXCEPT_DONE}
            onClick={onSave}
            disabled={update.isPending}
            className="text-wa-green hover:text-wa-green"
          >
            <Check className="size-4" />
          </Button>
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
          <h3 className="px-4 pb-1 pt-2 text-xs font-medium text-wa-green">
            {COPY.PRIVACY_EXCEPT_CONTACTS}
          </h3>
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
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-wa-border bg-wa-panel-2 px-4 py-3">
          <span className="text-sm text-wa-text">
            {COPY.PRIVACY_EXCEPT_COUNT(selected.size)}
          </span>
          <Button
            size="icon"
            onClick={onSave}
            disabled={update.isPending}
            aria-label={COPY.PRIVACY_EXCEPT_DONE}
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            {update.isPending ? (
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

function ContactRow({ contact, checked, onToggle }) {
  const initials = (contact.name ?? "??").slice(0, 2).toUpperCase();
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-wa-panel-2"
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
