"use client";

import { useState } from "react";
import { MessageCircle, MoreVertical, SmilePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  useDeleteChannelPostMutation,
  useToggleChannelPostReactionMutation,
} from "@/tanstack/channels/mutations";
import { cn } from "@/utils/cn";

import { ChannelPostMedia } from "./channel-post-media";
import { ChannelPostThreadSheet } from "./channel-post-thread-sheet";

// Per-post bubble in the channel feed. The owner sees a 3-dot menu
// with Delete; everyone else sees the reaction picker and a "view
// replies" pill.
//
// Reactions are tap-to-toggle from a small fixed set. Picking the
// same emoji a second time removes it (server semantics — see
// toggleChannelPostReaction in lib/channels.js).
const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "😮", "🙏"];

export function ChannelPostCard({ post, channelId, isOwner }) {
  const { user } = useAuth();
  const react = useToggleChannelPostReactionMutation(channelId);
  const del = useDeleteChannelPostMutation(channelId);
  const [threadOpen, setThreadOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const author = post.author ?? {};
  const initials = (author.name ?? "??").slice(0, 2).toUpperCase();
  const when = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "";

  // Group reactions by emoji for the count pill display.
  const grouped = (post.reactions ?? []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});
  const myReactions = new Set(
    (post.reactions ?? [])
      .filter((r) => r.userId === user?.id)
      .map((r) => r.emoji),
  );

  const onPickReaction = (emoji) => {
    setPickerOpen(false);
    react.mutate({ postId: post.id, emoji, userId: user?.id });
  };

  const onDelete = () =>
    del.mutate(post.id, {
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to delete"),
    });

  const replyCount = post._count?.replies ?? 0;

  return (
    <>
      <article className="rounded-lg border border-wa-border bg-wa-panel p-3 sm:p-4">
        <header className="flex items-start gap-3">
          <Avatar className="size-9">
            <AvatarImage src={author.avatar ?? undefined} alt={author.name} />
            <AvatarFallback className="bg-wa-panel-3 text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-wa-text">
              {author.name ?? "Channel"}
            </span>
            <span className="truncate text-xs text-wa-text-muted">{when}</span>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="More"
                  className="text-wa-text-muted hover:text-wa-text"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-wa-danger focus:text-wa-danger"
                >
                  <Trash2 className="mr-2 size-4" /> Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {post.content && (
          <p className="mt-3 whitespace-pre-wrap break-words text-sm text-wa-text">
            {post.content}
          </p>
        )}

        {/* Media renders BELOW the caption — matches Telegram's
            broadcast layout where context (caption) is the headline
            and the asset is the supporting visual. */}
        <ChannelPostMedia post={post} />

        <footer className="mt-3 flex flex-wrap items-center gap-2">
          {Object.entries(grouped).map(([emoji, count]) => {
            const mine = myReactions.has(emoji);
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onPickReaction(emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                  mine
                    ? "border-wa-green bg-wa-green-soft text-wa-green"
                    : "border-wa-border bg-wa-panel-2 text-wa-text-muted hover:text-wa-text",
                )}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            );
          })}

          <DropdownMenu open={pickerOpen} onOpenChange={setPickerOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="React"
                className="text-wa-text-muted hover:text-wa-text"
              >
                <SmilePlus className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="flex w-auto gap-1 p-1">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onPickReaction(emoji)}
                  className="rounded p-1 text-lg leading-none transition-transform hover:scale-110"
                  aria-label={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setThreadOpen(true)}
            className="ml-auto text-xs text-wa-text-muted hover:text-wa-text"
          >
            <MessageCircle className="mr-1 size-4" />
            {replyCount > 0
              ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
              : "Reply"}
          </Button>
        </footer>
      </article>

      <ChannelPostThreadSheet
        open={threadOpen}
        onOpenChange={setThreadOpen}
        post={post}
      />
    </>
  );
}
