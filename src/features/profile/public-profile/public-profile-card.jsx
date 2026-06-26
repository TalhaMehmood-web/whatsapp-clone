"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AtSign,
  Check,
  Clock,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useRespondFriendRequestMutation,
  useSendFriendRequestMutation,
} from "@/tanstack/friend-requests/mutations";
import {
  useIncomingFriendRequestsQuery,
  useOutgoingFriendRequestsQuery,
} from "@/tanstack/friend-requests/queries";
import { useStartChatMutation } from "@/tanstack/chat/mutations";
import { lastSeenLabel } from "@/utils/date-format";
import { COPY, ROUTES } from "@/config/constants";

// Rendered by /u/[handle]. Headerless card with avatar + name + handle, the
// "about" line, an at-a-glance presence + joined date, then a relationship-
// aware action footer.
//
// The profile object is the shape returned by GET /api/u/[handle] — the
// public user select + `relationship` enum.
export function PublicProfileCard({ profile }) {
  const router = useRouter();
  const send = useSendFriendRequestMutation();
  const respond = useRespondFriendRequestMutation();
  const start = useStartChatMutation();

  // We need the request id for accept/decline/cancel. Pull the cached
  // incoming + outgoing lists and look up by peer id.
  const { data: incoming } = useIncomingFriendRequestsQuery();
  const { data: outgoing } = useOutgoingFriendRequestsQuery();
  const incomingId = incoming?.find((r) => r.from?.id === profile.id)?.id;
  const outgoingId = outgoing?.find((r) => r.to?.id === profile.id)?.id;

  const initials = (profile.name ?? profile.handle ?? "??")
    .slice(0, 2)
    .toUpperCase();

  const isOnline = profile.isOnline;
  const presence = isOnline
    ? COPY.PROFILE_ONLINE
    : profile.lastSeen
      ? lastSeenLabel(profile.lastSeen)
      : null;
  const joinedAt = profile.createdAt
    ? format(new Date(profile.createdAt), "MMMM yyyy")
    : null;

  const onMessage = () =>
    start.mutate(profile.id, {
      onSuccess: (chat) => router.push(ROUTES.CHAT_DETAIL(chat.id)),
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Could not open chat"),
    });

  const onAdd = () =>
    send.mutate(profile.id, {
      onSuccess: () => toast.success(COPY.REQUESTS_SENT_TOAST),
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Could not send request"),
    });

  const onAccept = () => {
    if (!incomingId) return;
    respond.mutate(
      { id: incomingId, action: "accept" },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed"),
      },
    );
  };

  const onDecline = () => {
    if (!incomingId) return;
    respond.mutate(
      { id: incomingId, action: "decline" },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed"),
      },
    );
  };

  const onCancel = () => {
    if (!outgoingId) return;
    respond.mutate(
      { id: outgoingId, action: "cancel" },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed"),
      },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-10 text-center">
      <Avatar className="size-32">
        <AvatarImage src={profile.avatar ?? undefined} alt={profile.name} />
        <AvatarFallback className="bg-wa-panel-3 text-2xl">
          {initials}
        </AvatarFallback>
      </Avatar>

      <h1 className="mt-4 text-2xl font-medium text-wa-text">
        {profile.name}
      </h1>
      <p className="flex items-center gap-1 text-sm text-wa-green">
        <AtSign className="size-4" />
        {profile.handle ?? "—"}
      </p>

      {presence && (
        <p className="mt-1 text-xs text-wa-text-muted">{presence}</p>
      )}

      {profile.about && (
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-wa-text-muted">
          {profile.about}
        </p>
      )}

      <Separator className="my-6 w-full" />

      <div className="grid w-full grid-cols-1 gap-2 text-left sm:grid-cols-2">
        {joinedAt && (
          <Stat icon={Clock} label={COPY.PROFILE_JOINED} value={joinedAt} />
        )}
        {profile.relationship === "FRIENDS" && (
          <Stat
            icon={ShieldCheck}
            label="Connection"
            value={COPY.FRIENDS_LABEL}
          />
        )}
      </div>

      <ActionFooter
        relationship={profile.relationship}
        canAct={{
          incoming: !!incomingId,
          outgoing: !!outgoingId,
        }}
        loading={{
          add: send.isPending,
          respond: respond.isPending,
          start: start.isPending,
        }}
        onMessage={onMessage}
        onAdd={onAdd}
        onAccept={onAccept}
        onDecline={onDecline}
        onCancel={onCancel}
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-wa-panel-2 px-3 py-2 text-sm">
      <Icon className="size-4 text-wa-text-muted" />
      <div className="flex min-w-0 flex-col">
        <span className="text-[11px] uppercase tracking-wider text-wa-text-muted">
          {label}
        </span>
        <span className="truncate text-wa-text">{value}</span>
      </div>
    </div>
  );
}

function ActionFooter({
  relationship,
  canAct,
  loading,
  onMessage,
  onAdd,
  onAccept,
  onDecline,
  onCancel,
}) {
  if (relationship === "SELF") {
    return (
      <p className="mt-8 text-xs text-wa-text-muted">
        This is your own profile.
      </p>
    );
  }

  if (relationship === "FRIENDS") {
    return (
      <div className="mt-8 flex w-full justify-center">
        <Button
          size="lg"
          onClick={onMessage}
          loading={loading.start}
          className="bg-wa-green text-white hover:bg-wa-green/90"
        >
          <MessageSquare className="mr-2 size-4" />
          Message
        </Button>
      </div>
    );
  }

  if (relationship === "INCOMING") {
    return (
      <div className="mt-8 flex w-full flex-col items-center gap-2">
        <p className="text-xs text-wa-text-muted">{COPY.PROFILE_INCOMING_HINT}</p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={onDecline}
            disabled={!canAct.incoming || loading.respond}
            className="text-wa-text-muted hover:text-wa-danger"
          >
            <X className="mr-2 size-4" />
            {COPY.FRIEND_DECLINE}
          </Button>
          <Button
            size="lg"
            onClick={onAccept}
            loading={loading.respond}
            disabled={!canAct.incoming}
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            <Check className="mr-2 size-4" />
            {COPY.FRIEND_ACCEPT}
          </Button>
        </div>
      </div>
    );
  }

  if (relationship === "OUTGOING") {
    return (
      <div className="mt-8 flex w-full flex-col items-center gap-2">
        <p className="text-xs text-wa-text-muted">{COPY.PROFILE_OUTGOING_HINT}</p>
        <Button
          variant="ghost"
          size="lg"
          onClick={onCancel}
          disabled={!canAct.outgoing || loading.respond}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <UserCheck className="mr-2 size-4" />
          {COPY.FRIEND_PENDING}
        </Button>
      </div>
    );
  }

  // NONE
  return (
    <div className="mt-8 flex w-full flex-col items-center gap-2">
      <p className="text-xs text-wa-text-muted">
        {COPY.PROFILE_FRIEND_REQ_NEEDED}
      </p>
      <Button
        size="lg"
        onClick={onAdd}
        loading={loading.add}
        className="bg-wa-green text-white hover:bg-wa-green/90"
      >
        <UserPlus className="mr-2 size-4" />
        {COPY.FRIEND_ADD}
      </Button>
    </div>
  );
}
