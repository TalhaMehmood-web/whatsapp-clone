"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchUsersQuery } from "@/tanstack/users/queries";
import { useAddMembersMutation } from "@/tanstack/groups/mutations";
import { COPY } from "@/config/constants";

// Inline "add members" panel inside the group-info sheet.
// Existing member ids are passed in so we hide them from the picker.
export function GroupInfoAddMembers({ chatId, existingIds }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 200);
  const { data: results = [], isFetching } = useSearchUsersQuery(debounced);
  const add = useAddMembersMutation(chatId);

  const filtered = results.filter((u) => !existingIds.includes(u.id));

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-wa-text">
        <Plus className="size-4 text-wa-green" />
        {COPY.GROUP_INFO_ADD_MEMBERS}
      </div>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={COPY.NEW_CHAT_SEARCH_PLACEHOLDER}
          className="pl-9"
        />
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {debounced && isFetching ? (
          <div className="flex justify-center py-3 text-wa-text-muted">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          debounced ? (
            <p className="px-2 py-2 text-xs text-wa-text-muted">
              {COPY.NEW_CHAT_NO_RESULTS}
            </p>
          ) : null
        ) : (
          filtered.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5"
            >
              <Avatar className="size-8">
                <AvatarImage src={u.avatar ?? undefined} alt={u.name} />
                <AvatarFallback className="bg-wa-panel-3 text-[10px]">
                  {(u.name ?? "??").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm">{u.name}</span>
              <Button
                size="sm"
                loading={add.isPending}
                onClick={() =>
                  add.mutate([u.id], {
                    onSuccess: () => {
                      setSearch("");
                    },
                    onError: (err) =>
                      toast.error(err.response?.data?.error ?? "Failed"),
                  })
                }
              >
                Add
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
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
