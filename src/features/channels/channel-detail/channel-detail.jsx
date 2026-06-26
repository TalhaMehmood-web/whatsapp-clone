"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChannelQuery } from "@/tanstack/channels/queries";
import { useSubscribeChannelMutation } from "@/tanstack/channels/mutations";
import { COPY } from "@/config/constants";

export function ChannelDetail({ id }) {
  const { data: channel, isLoading } = useChannelQuery(id);
  const subscribe = useSubscribeChannelMutation();

  if (isLoading || !channel) {
    return (
      <div className="flex h-full items-center justify-center bg-wa-bg text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-wa-bg">
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <Avatar className="size-24">
          <AvatarImage src={channel.photo ?? undefined} alt={channel.name} />
          <AvatarFallback className="bg-wa-panel-3 text-lg">
            {channel.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-medium text-wa-text">{channel.name}</h2>
        <p className="text-sm text-wa-text-muted">@{channel.handle}</p>
        {channel.description && (
          <p className="mt-2 max-w-md text-sm text-wa-text-muted">
            {channel.description}
          </p>
        )}
        <Button
          className="mt-4"
          onClick={() =>
            subscribe.mutate(
              { channelId: channel.id, value: !channel.isSubscribed },
              {
                onError: (err) =>
                  toast.error(err.response?.data?.error ?? "Failed"),
              },
            )
          }
          loading={subscribe.isPending}
        >
          {channel.isSubscribed
            ? COPY.CHANNELS_FOLLOWING
            : COPY.CHANNELS_FOLLOW}
        </Button>
      </div>
    </div>
  );
}
