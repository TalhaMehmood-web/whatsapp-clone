"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, UserCheck, UserPlus, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  useRespondFriendRequestMutation,
  useSendFriendRequestMutation,
} from "@/tanstack/friend-requests/mutations";
import { useStartChatMutation } from "@/tanstack/chat/mutations";
import { COPY, ROUTES } from "@/config/constants";

// One row in a user list (search results, friends list, etc.). The action
// button on the right depends on the relationship.
//
// `peer.relationship` is "NONE" | "OUTGOING" | "INCOMING" | "FRIENDS" |
//                    "SELF"
//
// `outgoingRequestId` / `incomingRequestId` are used by /requests to
// dispatch the right PATCH; when not provided we look the request up by
// the relationship label only.
export function UserResultRow({
  peer,
  outgoingRequestId,
  incomingRequestId,
  onAfterAction,
}) {
  const router = useRouter();
  const send = useSendFriendRequestMutation();
  const respond = useRespondFriendRequestMutation();
  const start = useStartChatMutation();

  const relationship = peer.relationship ?? "NONE";

  const initials = (peer.name ?? peer.handle ?? "??").slice(0, 2).toUpperCase();

  const handleAdd = () =>
    send.mutate(peer.id, {
      onSuccess: () => toast.success(COPY.REQUESTS_SENT_TOAST),
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Could not send request"),
      onSettled: onAfterAction,
    });

  const handleAccept = () =>
    respond.mutate(
      { id: incomingRequestId, action: "accept" },
      {
        onError: (err) => toast.error(err.response?.data?.error ?? "Failed"),
        onSettled: onAfterAction,
      },
    );

  const handleDecline = () =>
    respond.mutate(
      { id: incomingRequestId, action: "decline" },
      {
        onError: (err) => toast.error(err.response?.data?.error ?? "Failed"),
        onSettled: onAfterAction,
      },
    );

  const handleCancel = () =>
    respond.mutate(
      { id: outgoingRequestId, action: "cancel" },
      {
        onError: (err) => toast.error(err.response?.data?.error ?? "Failed"),
        onSettled: onAfterAction,
      },
    );

  const handleMessage = () =>
    start.mutate(peer.id, {
      onSuccess: (chat) => router.push(ROUTES.CHAT_DETAIL(chat.id)),
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Could not open chat"),
    });

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-wa-panel-2">
      <Avatar className="size-11">
        <AvatarImage src={peer.avatar ?? undefined} alt={peer.name} />
        <AvatarFallback className="bg-wa-panel-3 text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-wa-text">{peer.name}</span>
        {peer.handle ? (
          <Link
            href={ROUTES.PROFILE(peer.handle)}
            onClick={(e) => e.stopPropagation()}
            className="truncate text-xs text-wa-text-muted hover:text-wa-green hover:underline"
          >
            @{peer.handle}
          </Link>
        ) : (
          <span className="truncate text-xs text-wa-text-muted">
            {peer.email ?? peer.phone ?? "—"}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {relationship === "FRIENDS" && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleMessage}
            loading={start.isPending}
          >
            <UserCheck className="mr-1.5 size-4" />
            Message
          </Button>
        )}
        {relationship === "NONE" && (
          <Button
            size="sm"
            onClick={handleAdd}
            loading={send.isPending}
            className="bg-wa-green text-nowrap flex items-center text-white hover:bg-wa-green/90"
          >
            <UserPlus className="mr-1.5 size-4" />
            <span>{COPY.FRIEND_ADD}</span>
          </Button>
        )}
        {relationship === "OUTGOING" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={outgoingRequestId ? handleCancel : undefined}
            disabled={!outgoingRequestId || respond.isPending}
            className="text-wa-text-muted hover:text-wa-text"
          >
            {COPY.FRIEND_PENDING}
          </Button>
        )}
        {relationship === "INCOMING" && (
          <>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={COPY.FRIEND_DECLINE}
              onClick={incomingRequestId ? handleDecline : undefined}
              disabled={!incomingRequestId || respond.isPending}
              className="text-wa-text-muted hover:text-wa-danger"
            >
              <X className="size-4" />
            </Button>
            <Button
              size="sm"
              onClick={incomingRequestId ? handleAccept : undefined}
              loading={respond.isPending}
              disabled={!incomingRequestId}
              className="bg-wa-green text-white hover:bg-wa-green/90"
            >
              <Check className="mr-1.5 size-4" />
              {COPY.FRIEND_ACCEPT}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
