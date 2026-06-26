"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchUsersQuery } from "@/tanstack/users/queries";
import { useAddMembersMutation } from "@/tanstack/groups/mutations";
import { COPY } from "@/config/constants";

// Single full-width "Add member" row pinned to the top of the member
// list, matching the WhatsApp Web screenshot: a green circular +icon
// avatar plus the label. Tapping it opens a search dialog that admins
// use to invite more friends.
export function GroupInfoAddMembersRow({ chatId, existingIds }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-wa-panel-2"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-wa-green text-white">
          <UserPlus className="size-5" />
        </span>
        <span className="text-sm text-wa-text">
          {COPY.GROUP_INFO_ADD_MEMBERS}
        </span>
      </button>

      <AddMembersDialog
        chatId={chatId}
        existingIds={existingIds}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

function AddMembersDialog({ chatId, existingIds, open, onOpenChange }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 200);
  const { data: results = [], isFetching } = useSearchUsersQuery(debounced);
  const add = useAddMembersMutation(chatId);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filtered = results.filter((u) => !existingIds.includes(u.id));

  const onAdd = (userId) =>
    add.mutate([userId], {
      onSuccess: () => {
        toast.success("Member added");
        onOpenChange(false);
      },
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to add member"),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-3">
        <DialogHeader>
          <DialogTitle>{COPY.GROUP_INFO_ADD_MEMBERS}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={COPY.NEW_CHAT_SEARCH_PLACEHOLDER}
            className="pl-9"
            autoFocus
          />
        </div>

        <ScrollArea className="-mx-2 max-h-72">
          {!debounced ? (
            <p className="px-3 py-6 text-center text-xs text-wa-text-muted">
              {COPY.NEW_CHAT_EMPTY_HINT}
            </p>
          ) : isFetching ? (
            <div className="flex justify-center py-6 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-wa-text-muted">
              {COPY.NEW_CHAT_NO_RESULTS}
            </p>
          ) : (
            filtered.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-wa-panel-2"
              >
                <Avatar className="size-9">
                  <AvatarImage src={u.avatar ?? undefined} alt={u.name} />
                  <AvatarFallback className="bg-wa-panel-3 text-xs">
                    {(u.name ?? "??").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm text-wa-text">
                    {u.name}
                  </span>
                  {u.handle && (
                    <span className="truncate text-xs text-wa-text-muted">
                      @{u.handle}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  loading={add.isPending}
                  onClick={() => onAdd(u.id)}
                  className="bg-wa-green text-white hover:bg-wa-green/90"
                >
                  Add
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
