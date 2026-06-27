"use client";

import { useState } from "react";
import { Loader2, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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
import { useChannelPostRepliesQuery } from "@/tanstack/channels/queries";
import { useCreateChannelPostReplyMutation } from "@/tanstack/channels/mutations";
import { CHANNEL_POST_REPLY_MAX } from "@/config/constants";

// Threaded replies for a single channel post. Loaded on-demand when
// the sheet opens (the parent post card defers via `enabled: open`).
// Fanout is bounded — replies go ONLY to the post author and other
// repliers, not the whole channel.
export function ChannelPostThreadSheet({ open, onOpenChange, post }) {
  const { data: replies, isLoading } = useChannelPostRepliesQuery(post?.id, {
    enabled: open,
  });
  const create = useCreateChannelPostReplyMutation(post?.id);
  const [value, setValue] = useState("");

  const atCap = (replies?.length ?? 0) >= CHANNEL_POST_REPLY_MAX;

  const submit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || create.isPending || atCap) return;
    create.mutate(trimmed, {
      onSuccess: () => setValue(""),
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to reply"),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-wa-border bg-wa-panel p-0 text-wa-text sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center gap-2 space-y-0 border-b border-wa-border px-3 py-3 text-left">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="text-wa-text-muted hover:text-wa-text"
          >
            <X className="size-4" />
          </Button>
          <SheetTitle className="flex-1 text-sm font-medium text-wa-text">
            Thread
          </SheetTitle>
          <SheetDescription className="sr-only">
            Replies to this post
          </SheetDescription>
          <span className="text-xs text-wa-text-muted">
            {(replies?.length ?? 0)}/{CHANNEL_POST_REPLY_MAX}
          </span>
        </SheetHeader>

        {/* Pinned original post at the top so the thread context is
            always visible while scrolling replies. */}
        {post && (
          <div className="border-b border-wa-border bg-wa-panel-2/40 px-4 py-3">
            <p className="text-xs text-wa-text-muted">
              {post.author?.name} · {post.createdAt
                ? formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })
                : ""}
            </p>
            {post.content && (
              <p className="mt-1 text-sm text-wa-text">
                {post.content}
              </p>
            )}
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-10 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (replies?.length ?? 0) === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-wa-text-muted">
              Be the first to reply.
            </p>
          ) : (
            <ul className="flex flex-col gap-1 px-3 py-3">
              {replies.map((r) => (
                <ReplyRow key={r.id} reply={r} />
              ))}
            </ul>
          )}
        </ScrollArea>

        <form
          onSubmit={submit}
          className="flex items-end gap-2 border-t border-wa-border bg-wa-panel-2 px-3 py-2"
        >
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              atCap ? "Thread is full" : "Reply in this thread…"
            }
            rows={1}
            disabled={atCap}
            maxLength={1000}
            className="block max-h-32 min-h-10 flex-1 resize-none rounded-lg border-0 bg-wa-panel px-3 py-2 text-sm text-wa-text placeholder:text-wa-text-muted focus:outline-none disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send"
            loading={create.isPending}
            disabled={!value.trim() || atCap}
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            <SendHorizontal className="size-5" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ReplyRow({ reply }) {
  const a = reply.author ?? {};
  const initials = (a.name ?? "??").slice(0, 2).toUpperCase();
  const when = reply.createdAt
    ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })
    : "";
  return (
    <li className="flex items-start gap-2 px-1">
      <Avatar className="size-8">
        <AvatarImage src={a.avatar ?? undefined} alt={a.name} />
        <AvatarFallback className="bg-wa-panel-3 text-[10px]">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col rounded-md bg-wa-panel-2 px-3 py-2">
        <span className="text-xs text-wa-text-muted">
          {a.name ?? "—"} · {when}
        </span>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-wa-text">
          {reply.content}
        </p>
      </div>
    </li>
  );
}
