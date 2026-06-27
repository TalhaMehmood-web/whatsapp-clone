"use client";

import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCommunityByHandleQuery } from "@/tanstack/communities/queries";
import { useJoinCommunityMutation } from "@/tanstack/communities/mutations";
import { ROUTES } from "@/config/constants";

// /c/{handle} — public-readable community card with a Join button.
// Anyone (even unauthenticated) can see the metadata; clicking Join
// bounces them through /login if needed and back here afterwards.
export function CommunityInviteLanding({ handle }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: community, isLoading, isError } =
    useCommunityByHandleQuery(handle);
  const join = useJoinCommunityMutation();

  if (isLoading || authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-wa-bg text-wa-text-muted">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (isError || !community) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-wa-bg px-6 text-center text-wa-text-muted">
        <p className="text-sm">This community link is no longer valid.</p>
        <Button asChild>
          <a href={ROUTES.CHAT_INDEX}>Go to chats</a>
        </Button>
      </div>
    );
  }

  const initials = (community.name ?? "??").slice(0, 2).toUpperCase();

  const onJoin = () => {
    if (!isAuthenticated) {
      // Send the user through login first; bounce back to this URL on
      // success so the join intent isn't lost.
      const next = encodeURIComponent(`/c/${handle}`);
      router.push(`${ROUTES.LOGIN}?next=${next}`);
      return;
    }
    join.mutate(handle, {
      onSuccess: ({ communityId }) =>
        router.push(`${ROUTES.COMMUNITIES}/${communityId}`),
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Couldn't join"),
    });
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-wa-bg px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-wa-border bg-wa-panel p-6 text-center text-wa-text shadow-xl shadow-black/40">
        <Avatar className="mx-auto size-24 rounded-2xl">
          <AvatarImage src={community.photo ?? undefined} alt={community.name} />
          <AvatarFallback className="rounded-2xl bg-wa-panel-3 text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-xl font-semibold">{community.name}</h1>
        {community.handle && (
          <p className="text-sm text-wa-text-muted">@{community.handle}</p>
        )}
        {community.description && (
          <p className="mt-4 text-sm text-wa-text-muted">{community.description}</p>
        )}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-wa-text-muted">
          <span className="flex items-center gap-1">
            <Users className="size-3" /> {community.memberCount} members
          </span>
          <span>·</span>
          <span>{community.subGroupCount} groups</span>
        </div>

        <Button
          onClick={onJoin}
          loading={join.isPending}
          className="mt-6 w-full bg-wa-green text-white hover:bg-wa-green/90"
        >
          {user ? "Join community" : "Sign in to join"}
        </Button>
      </div>
    </div>
  );
}
