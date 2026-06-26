"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSubscribeChannelMutation } from "@/tanstack/channels/mutations";
import { COPY, ROUTES } from "@/config/constants";

export function ChannelRow({ channel }) {
  const subscribe = useSubscribeChannelMutation();

  const onToggle = (e) => {
    e.preventDefault();
    subscribe.mutate(
      { channelId: channel.id, value: !channel.isSubscribed },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Could not update"),
      },
    );
  };

  return (
    <Link
      href={`${ROUTES.CHANNELS}/${channel.id}`}
      className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-wa-panel-2"
    >
      <Avatar className="size-12">
        <AvatarImage src={channel.photo ?? undefined} alt={channel.name} />
        <AvatarFallback className="bg-wa-panel-3 text-sm">
          {(channel.name ?? "??").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-wa-text">{channel.name}</span>
        <span className="truncate text-xs text-wa-text-muted">
          @{channel.handle}
        </span>
      </div>
      <Button
        size="sm"
        variant={channel.isSubscribed ? "secondary" : "default"}
        onClick={onToggle}
        loading={subscribe.isPending}
      >
        {channel.isSubscribed ? COPY.CHANNELS_FOLLOWING : COPY.CHANNELS_FOLLOW}
      </Button>
    </Link>
  );
}
