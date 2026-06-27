"use client";

import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useChannelByHandleQuery } from "@/tanstack/channels/queries";
import { useSubscribeChannelMutation } from "@/tanstack/channels/mutations";
import { COPY, ROUTES } from "@/config/constants";

// /ch/{handle} — public-readable channel card with a Follow / Open
// button. Anyone (even unauthenticated) sees metadata; the CTA falls
// back to login when needed and bounces back here on success.
export function ChannelInviteLanding({ handle }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: channel, isLoading, isError } =
    useChannelByHandleQuery(handle);
  const subscribe = useSubscribeChannelMutation();

  if (isLoading || authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-wa-bg text-wa-text-muted">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (isError || !channel) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-wa-bg px-6 text-center text-wa-text-muted">
        <p className="text-sm">This channel link is no longer valid.</p>
        <Button asChild>
          <a href={ROUTES.CHANNELS}>Browse channels</a>
        </Button>
      </div>
    );
  }

  const initials = (channel.name ?? "??").slice(0, 2).toUpperCase();

  const onCta = () => {
    if (!isAuthenticated) {
      const next = encodeURIComponent(`/ch/${handle}`);
      router.push(`${ROUTES.LOGIN}?next=${next}`);
      return;
    }
    if (channel.isSubscribed) {
      router.push(`${ROUTES.CHANNELS}/${channel.id}`);
      return;
    }
    subscribe.mutate(
      { channelId: channel.id, value: true },
      {
        onSuccess: () => router.push(`${ROUTES.CHANNELS}/${channel.id}`),
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Couldn't follow"),
      },
    );
  };

  let ctaLabel = "Sign in to follow";
  if (isAuthenticated) {
    ctaLabel = channel.isSubscribed ? "Open channel" : COPY.CHANNELS_FOLLOW;
  }

  return (
    <div className="flex h-dvh items-center justify-center bg-wa-bg px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-wa-border bg-wa-panel p-6 text-center text-wa-text shadow-xl shadow-black/40">
        <Avatar className="mx-auto size-24">
          <AvatarImage src={channel.photo ?? undefined} alt={channel.name} />
          <AvatarFallback className="bg-wa-panel-3 text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-xl font-semibold">{channel.name}</h1>
        <p className="text-sm text-wa-text-muted">@{channel.handle}</p>
        {channel.description && (
          <p className="mt-4 text-sm text-wa-text-muted">{channel.description}</p>
        )}
        <p className="mt-5 flex items-center justify-center gap-1 text-xs text-wa-text-muted">
          <Users className="size-3" />
          {channel.subscriberCount ?? 0} subscribers
        </p>

        <Button
          onClick={onCta}
          loading={subscribe.isPending}
          className="mt-6 w-full bg-wa-green text-white hover:bg-wa-green/90"
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
