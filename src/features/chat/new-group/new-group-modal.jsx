"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSearchUsersQuery } from "@/tanstack/users/queries";
import { useCreateGroupMutation } from "@/tanstack/groups/mutations";
import { COPY, ROUTES } from "@/config/constants";
import { newGroupSchema } from "./schema";

export function NewGroupModal({ open, onOpenChange }) {
  const router = useRouter();
  const [picked, setPicked] = useState([]); // [{id, name, avatar}]
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 200);
  const { data: results = [], isFetching } = useSearchUsersQuery(debounced);
  const create = useCreateGroupMutation();

  const form = useForm({
    resolver: zodResolver(newGroupSchema),
    defaultValues: { name: "", memberIds: [] },
  });

  // Reset on close.
  useEffect(() => {
    if (!open) {
      setPicked([]);
      setSearch("");
      form.reset({ name: "", memberIds: [] });
    }
  }, [open, form]);

  // Keep RHF memberIds in sync with the picked list.
  useEffect(() => {
    form.setValue(
      "memberIds",
      picked.map((p) => p.id),
      { shouldValidate: picked.length > 0 },
    );
  }, [picked, form]);

  const togglePick = (user) => {
    setPicked((prev) =>
      prev.some((p) => p.id === user.id)
        ? prev.filter((p) => p.id !== user.id)
        : [...prev, user],
    );
  };

  const onSubmit = (values) =>
    create.mutate(
      { name: values.name, memberIds: values.memberIds },
      {
        onSuccess: (chat) => {
          onOpenChange(false);
          router.push(ROUTES.CHAT_DETAIL(chat.id));
        },
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Could not create group"),
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{COPY.NEW_GROUP_TITLE}</DialogTitle>
          <DialogDescription>{COPY.NEW_GROUP_DESCRIPTION}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4 px-6 pt-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{COPY.NEW_GROUP_NAME_LABEL}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={COPY.NEW_GROUP_NAME_PLACEHOLDER}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="memberIds"
                render={() => (
                  <FormItem>
                    <FormLabel>{COPY.NEW_GROUP_MEMBERS_LABEL}</FormLabel>
                    {picked.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {picked.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePick(p)}
                            className="flex items-center gap-1 rounded-full bg-wa-green-soft px-2 py-1 text-xs text-wa-green"
                          >
                            {p.name}
                            <X className="size-3" />
                          </button>
                        ))}
                      </div>
                    )}
                    <FormControl>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
                        <Input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder={COPY.NEW_CHAT_SEARCH_PLACEHOLDER}
                          className="pl-9"
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-wa-text-muted">
                      {COPY.NEW_GROUP_MEMBERS_HINT}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ScrollArea className="mt-2 h-56 px-2">
              {!debounced ? null : isFetching ? (
                <div className="flex justify-center py-6 text-wa-text-muted">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : results.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-wa-text-muted">
                  {COPY.NEW_CHAT_NO_RESULTS}
                </p>
              ) : (
                results.map((u) => {
                  const isPicked = picked.some((p) => p.id === u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => togglePick(u)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-wa-panel-2"
                    >
                      <Avatar className="size-9">
                        <AvatarImage src={u.avatar ?? undefined} alt={u.name} />
                        <AvatarFallback className="bg-wa-panel-3 text-xs">
                          {(u.name ?? "??").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-sm">{u.name}</span>
                      {isPicked && (
                        <span className="rounded-full bg-wa-green px-2 py-0.5 text-[10px] text-white">
                          Added
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </ScrollArea>

            <DialogFooter className="px-6 py-4">
              <Button
                type="submit"
                loading={create.isPending}
                loadingText="Creating…"
              >
                {COPY.NEW_GROUP_CREATE}
              </Button>
            </DialogFooter>
          </form>
        </Form>
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
