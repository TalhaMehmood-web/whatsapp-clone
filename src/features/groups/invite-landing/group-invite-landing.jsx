"use client";

import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useGroupByInviteHandleQuery } from "@/tanstack/groups/queries";
import { useJoinGroupByInviteHandleMutation } from "@/tanstack/groups/mutations";
import { ROUTES } from "@/config/constants";

// /g/{handle} — public-readable group card with a Join button. Anyone
// (even unauthenticated) can see the metadata; clicking Join bounces
// them through /login if needed and back here afterwards. Mirrors the
// community + channel invite-landing pages so the three feel identical
// from the visitor's perspective.
export function GroupInviteLanding({ handle }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: group, isLoading, isError } =
    useGroupByInviteHandleQuery(handle);
  const join = useJoinGroupByInviteHandleMutation();

  if (isLoading || authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-wa-bg text-wa-text-muted">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-wa-bg px-6 text-center text-wa-text-muted">
        <p className="text-sm">This group link is no longer valid.</p>
        <Button asChild>
          <a href={ROUTES.CHAT_INDEX}>Go to chats</a>
        </Button>
      </div>
    );
  }

  const initials = (group.name ?? "??").slice(0, 2).toUpperCase();

  const onJoin = () => {
    if (!isAuthenticated) {
      const next = encodeURIComponent(`/g/${handle}`);
      router.push(`${ROUTES.LOGIN}?next=${next}`);
      return;
    }
    join.mutate(handle, {
      onSuccess: ({ chatId }) => router.push(ROUTES.CHAT_DETAIL(chatId)),
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Couldn't join"),
    });
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-wa-bg px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-wa-border bg-wa-panel p-6 text-center text-wa-text shadow-xl shadow-black/40">
        <Avatar className="mx-auto size-24 rounded-2xl">
          <AvatarImage src={group.photo ?? undefined} alt={group.name ?? ""} />
          <AvatarFallback className="rounded-2xl bg-wa-panel-3 text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-xl font-semibold">{group.name ?? "Group"}</h1>
        {group.inviteHandle && (
          <p className="text-sm text-wa-text-muted">@{group.inviteHandle}</p>
        )}
        {group.description && (
          <p className="mt-4 text-sm text-wa-text-muted">
            {group.description}
          </p>
        )}
        <div className="mt-5 flex items-center justify-center gap-1 text-xs text-wa-text-muted">
          <Users className="size-3" /> {group.memberCount}{" "}
          {group.memberCount === 1 ? "member" : "members"}
        </div>

        <Button
          onClick={onJoin}
          loading={join.isPending}
          className="mt-6 w-full bg-wa-green text-white hover:bg-wa-green/90"
        >
          {user ? "Join group" : "Sign in to join"}
        </Button>
      </div>
    </div>
  );
}
