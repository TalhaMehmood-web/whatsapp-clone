"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChannelsExploreQuery } from "@/tanstack/channels/queries";
import { useSubscribeChannelMutation } from "@/tanstack/channels/mutations";
import { COPY, ROUTES } from "@/config/constants";

// /channels/explore — three discovery surfaces in one page:
//   - Trending: top 12 channels by subscriberCount.
//   - Friends-also-subscribe: channels accepted friends follow.
//   - Search: handle/name LIKE q (server-side, press-enter — per the
//     C11 audit matrix, not debounced).
//
// The page passes the COMMITTED query string to the tanstack hook so
// every search lands as its own infinite-cache entry — no per-keystroke
// network spam, and the user can step back through their searches via
// browser history if we wire that later.
export function ChannelsExplorePage() {
  const router = useRouter();
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [draft, setDraft] = useState("");
  const { data, isLoading } = useChannelsExploreQuery(submittedQuery);
  const subscribe = useSubscribeChannelMutation();

  const onSubmitSearch = (e) => {
    e.preventDefault();
    setSubmittedQuery(draft.trim());
  };

  const onClearSearch = () => {
    setDraft("");
    setSubmittedQuery("");
  };

  const onToggle = (channel) =>
    subscribe.mutate(
      { channelId: channel.id, value: !channel.isSubscribed },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed"),
      },
    );

  return (
    <div className="flex h-full flex-col bg-wa-bg text-wa-text">
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
        <h1 className="text-base font-medium text-wa-text">
          {COPY.CHANNELS_DISCOVER}
        </h1>
      </header>

      <form onSubmit={onSubmitSearch} className="shrink-0 px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-muted" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search channels by name or handle"
            className="h-9 rounded-full border-0 bg-wa-panel-2 pl-10 text-sm"
          />
        </div>
        {submittedQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-2 text-xs text-wa-text-muted hover:text-wa-text"
          >
            Clear search · "{submittedQuery}"
          </button>
        )}
      </form>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto max-w-2xl px-3 py-4 sm:px-4">
          {isLoading ? (
            <div className="flex justify-center py-12 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : submittedQuery ? (
            <Section title={`Results for "${submittedQuery}"`}>
              {(data?.search ?? []).length === 0 ? (
                <EmptyState label="No channels match that search." />
              ) : (
                data.search.map((c) => (
                  <ChannelRow
                    key={c.id}
                    channel={c}
                    onClick={() => router.push(`${ROUTES.CHANNELS}/${c.id}`)}
                    onToggle={() => onToggle(c)}
                  />
                ))
              )}
            </Section>
          ) : (
            <>
              {(data?.friends ?? []).length > 0 && (
                <Section title="Followed by friends">
                  {data.friends.map((c) => (
                    <ChannelRow
                      key={c.id}
                      channel={c}
                      meta={`${c.friendsCount} friend${
                        c.friendsCount === 1 ? "" : "s"
                      } subscribe`}
                      onClick={() => router.push(`${ROUTES.CHANNELS}/${c.id}`)}
                      onToggle={() => onToggle(c)}
                    />
                  ))}
                </Section>
              )}

              <Section title="Trending">
                {(data?.trending ?? []).length === 0 ? (
                  <EmptyState label="No public channels yet." />
                ) : (
                  data.trending.map((c) => (
                    <ChannelRow
                      key={c.id}
                      channel={c}
                      meta={`${c.subscriberCount} subscriber${
                        c.subscriberCount === 1 ? "" : "s"
                      }`}
                      onClick={() => router.push(`${ROUTES.CHANNELS}/${c.id}`)}
                      onToggle={() => onToggle(c)}
                    />
                  ))
                )}
              </Section>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <h2 className="px-1 pb-2 text-xs font-medium uppercase tracking-wider text-wa-text-muted">
        {title}
      </h2>
      <ul className="flex flex-col gap-1">{children}</ul>
    </section>
  );
}

function ChannelRow({ channel, meta, onClick, onToggle }) {
  const initials = (channel.name ?? "??").slice(0, 2).toUpperCase();
  return (
    <li className="flex items-center gap-3 rounded-lg border border-wa-border bg-wa-panel p-3 transition-colors hover:bg-wa-panel-2">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Avatar className="size-10">
          <AvatarImage src={channel.photo ?? undefined} alt={channel.name} />
          <AvatarFallback className="bg-wa-panel-3 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-wa-text">
            {channel.name}
          </span>
          <span className="truncate text-xs text-wa-text-muted">
            @{channel.handle}
            {meta ? ` · ${meta}` : ""}
          </span>
        </div>
      </button>
      <Button
        size="sm"
        variant={channel.isSubscribed ? "secondary" : "default"}
        onClick={onToggle}
        className={
          channel.isSubscribed
            ? ""
            : "bg-wa-green text-white hover:bg-wa-green/90"
        }
      >
        {channel.isSubscribed
          ? COPY.CHANNELS_FOLLOWING
          : COPY.CHANNELS_FOLLOW}
      </Button>
    </li>
  );
}

function EmptyState({ label }) {
  return (
    <p className="px-3 py-6 text-center text-sm text-wa-text-muted">{label}</p>
  );
}
