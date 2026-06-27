"use client";

import { useMemo, useState } from "react";
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
import { useChatsQuery } from "@/tanstack/chat/queries";
import { useAddSubGroupMutation } from "@/tanstack/communities/mutations";
import { CHAT_TAB, COPY } from "@/config/constants";
import { cn } from "@/utils/cn";

// "Add member group" picker. The community model says: ANY existing
// group chat you're a member of can be attached to ONE community at a
// time. So we list the user's groups, hide ones already in a community,
// and let them pick.
//
// We do NOT support creating a new group from inside the picker — the
// user can do that from the regular New group flow first. Keeps this
// component small and reuses the existing path.
export function AddSubGroupDialog({
  open,
  onOpenChange,
  communityId,
  existingChatIds = [],
}) {
  const { data: chats, isLoading } = useChatsQuery({ tab: CHAT_TAB.GROUPS });
  const add = useAddSubGroupMutation(communityId);

  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);

  const existingSet = useMemo(
    () => new Set(existingChatIds),
    [existingChatIds],
  );

  const candidates = useMemo(() => {
    const list = (chats ?? []).filter((entry) => {
      const id = entry?.chat?.id;
      if (!id || existingSet.has(id)) return false;
      // Skip groups already attached to a (different) community.
      if (entry.chat.communityId) return false;
      return true;
    });
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((entry) =>
      (entry.chat.name ?? "").toLowerCase().includes(q),
    );
  }, [chats, existingSet, query]);

  const onSave = async () => {
    if (!picked) return;
    try {
      await add.mutateAsync(picked);
      onOpenChange(false);
      setPicked(null);
      setQuery("");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to add group");
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
            {COPY.COMMUNITIES_SUB_GROUP_ADD}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {COPY.COMMUNITIES_SUB_GROUP_ADD}
          </DialogDescription>
        </div>

        <div className="shrink-0 px-3 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your groups"
              className="border-0 bg-wa-panel-2 pl-9"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-10 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : candidates.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-wa-text-muted">
              No eligible groups. Create one first or unattach a group from
              another community.
            </p>
          ) : (
            <ul className="flex flex-col">
              {candidates.map((entry) => {
                const c = entry.chat;
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
                        aria-hidden
                      >
                        {selected && <Check className="size-3" />}
                      </span>
                      <Avatar className="size-10 rounded-md">
                        <AvatarImage src={c.photo ?? undefined} alt={c.name} />
                        <AvatarFallback className="rounded-md bg-wa-panel-3 text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm text-wa-text">
                        {c.name ?? "Group"}
                      </span>
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
            onClick={onSave}
            disabled={!picked || add.isPending}
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            {add.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
