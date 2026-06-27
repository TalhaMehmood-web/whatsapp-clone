"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Info,
  Loader2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useChannelPostsQuery,
  useChannelQuery,
} from "@/tanstack/channels/queries";
import { useSubscribeChannelMutation } from "@/tanstack/channels/mutations";
import { useChannelRealtimeSync } from "@/hooks/use-channel-realtime-sync";
import { ChannelInfoSheet } from "@/features/channels/channel-info/channel-info-sheet";
import { COPY, ROUTES } from "@/config/constants";
import { toast } from "sonner";

import { ChannelOwnerEmpty } from "./channel-owner-empty";
import { ChannelPostCard } from "./channel-post-card";
import { ChannelPostComposer } from "./channel-post-composer";

// Full channel detail page. Layout:
//
//   ┌──────────────────────────────────────┐
//   │ ← back  avatar  name  @handle   ⋮    │  sticky header
//   ├──────────────────────────────────────┤
//   │ description (when set)               │
//   ├──────────────────────────────────────┤
//   │ posts feed (newest first)            │  scroll
//   ├──────────────────────────────────────┤
//   │ composer (owner only)                │  sticky footer
//   └──────────────────────────────────────┘
//
// Non-subscribers see the hero + a Subscribe button instead of posts.
// Owner sees a 3-dot menu with Delete. Realtime cache patches will
// land via a separate sync hook in a follow-up; reactions + replies
// invalidate locally on action.
export function ChannelDetail({ id }) {
  const router = useRouter();
  const { data: channel, isLoading } = useChannelQuery(id);
  const canRead = !!channel && (channel.isSubscribed || channel.isOwner);
  const {
    data: feed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChannelPostsQuery(canRead ? id : null);
  const subscribe = useSubscribeChannelMutation();
  const [infoOpen, setInfoOpen] = useState(false);

  // Live cache patches while the user has this channel open. Subscribes
  // to private-channel-{id} on mount, leaves on unmount. Refcounted in
  // the bus so multiple opens of the same channel don't double-bind.
  useChannelRealtimeSync(canRead ? id : null);

  if (isLoading || !channel) {
    return (
      <div className="flex h-full items-center justify-center bg-wa-bg text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const initials = (channel.name ?? "??").slice(0, 2).toUpperCase();

  const onToggleSubscribe = () =>
    subscribe.mutate(
      { channelId: id, value: !channel.isSubscribed },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed"),
      },
    );

  const posts = (feed?.pages ?? []).flatMap((p) => p.posts ?? []);

  return (
    <div className="flex h-full flex-col bg-wa-bg">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-wa-border bg-wa-panel-2 px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back"
          onClick={() => router.push(ROUTES.CHANNELS)}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <ArrowLeft className="size-5" />
        </Button>
        {/* Tapping the avatar / name opens the info sheet — matches
            WhatsApp's interaction. The Info icon on the right is the
            same trigger, kept for discoverability. */}
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-90"
        >
          <Avatar className="size-10">
            <AvatarImage src={channel.photo ?? undefined} alt={channel.name} />
            <AvatarFallback className="bg-wa-panel-3 text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-[15px] font-medium text-wa-text">
              {channel.name}
            </p>
            <p className="truncate text-[12px] text-wa-text-muted">
              @{channel.handle} · {channel.subscriberCount ?? 0}{" "}
              {channel.subscriberCount === 1 ? "subscriber" : "subscribers"}
            </p>
          </div>
        </button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Channel info"
          onClick={() => setInfoOpen(true)}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <Info className="size-5" />
        </Button>
      </header>

      {channel.description && (
        <div className="border-b border-wa-border bg-wa-panel-2/40 px-4 py-3">
          <p className="text-sm text-wa-text-muted">{channel.description}</p>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-3 py-3 sm:px-4">
          {!canRead && (
            <div className="rounded-lg border border-wa-border bg-wa-panel p-4 text-center">
              <p className="text-sm text-wa-text-muted">
                Subscribe to read posts from this channel.
              </p>
              <Button
                onClick={onToggleSubscribe}
                loading={subscribe.isPending}
                className="mt-3 bg-wa-green text-white hover:bg-wa-green/90"
              >
                {COPY.CHANNELS_FOLLOW}
              </Button>
            </div>
          )}

          {canRead && posts.length === 0 && (
            channel.isOwner ? (
              <div className="py-6">
                <ChannelOwnerEmpty channel={channel} />
              </div>
            ) : (
              <p className="px-3 py-10 text-center text-sm text-wa-text-muted">
                No posts yet.
              </p>
            )
          )}

          {posts.map((post) => (
            <ChannelPostCard
              key={post.id}
              post={post}
              channelId={id}
              isOwner={channel.isOwner}
            />
          ))}

          {hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              loading={isFetchingNextPage}
              className="mx-auto mt-2 text-wa-text-muted hover:text-wa-text"
            >
              Load older
            </Button>
          )}
        </div>
      </ScrollArea>

      {channel.isOwner && <ChannelPostComposer channelId={id} />}

      <ChannelInfoSheet
        open={infoOpen}
        onOpenChange={setInfoOpen}
        channelId={id}
      />
    </div>
  );
}
