"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff, Video } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSocketStore } from "@/stores/socket-store";
import { useUpdateCallMutation } from "@/tanstack/calls/mutations";
import { COPY, ROUTES, SOCKET_EVENT } from "@/config/constants";
import { CallStatus, CallType } from "@/models/enums";

// Listens for `call:offer` events from the server and shows a dialog with
// answer/decline. The mount lives in (main)/layout so the modal can appear
// from any route.
export function IncomingCallHost() {
  const socket = useSocketStore((s) => s.socket);
  const [offer, setOffer] = useState(null); // { callId, type, caller }
  const router = useRouter();
  const update = useUpdateCallMutation();

  useEffect(() => {
    if (!socket) return undefined;
    const onOffer = (data) => setOffer(data);
    const onUpdate = ({ callId, status }) => {
      // Auto-dismiss if the call moved to any terminal state (caller
      // cancelled, peer answered on another device, etc.) while this
      // dialog is still showing.
      if (offer?.callId !== callId) return;
      const isTerminal =
        status === CallStatus.DECLINED ||
        status === CallStatus.ENDED ||
        status === CallStatus.MISSED;
      if (isTerminal) setOffer(null);
    };
    socket.on(SOCKET_EVENT.CALL_OFFER, onOffer);
    socket.on(SOCKET_EVENT.CALL_UPDATE, onUpdate);
    return () => {
      socket.off(SOCKET_EVENT.CALL_OFFER, onOffer);
      socket.off(SOCKET_EVENT.CALL_UPDATE, onUpdate);
    };
  }, [socket, offer?.callId]);

  if (!offer) return null;

  const onAnswer = () =>
    update.mutate(
      { callId: offer.callId, status: CallStatus.ANSWERED },
      {
        onSuccess: () => {
          setOffer(null);
          router.push(`${ROUTES.CALLS}/${offer.callId}`);
        },
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed"),
      },
    );

  const onDecline = () =>
    update.mutate(
      { callId: offer.callId, status: CallStatus.DECLINED },
      {
        onSuccess: () => setOffer(null),
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed"),
      },
    );

  const peer = offer.caller ?? { name: "Unknown" };

  return (
    <Dialog open={!!offer} onOpenChange={(v) => !v && setOffer(null)}>
      <DialogContent className="max-w-sm p-0">
        <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
          <DialogTitle className="text-sm text-wa-text-muted">
            {COPY.CALL_INCOMING}
          </DialogTitle>
          <Avatar className="size-20">
            <AvatarImage src={peer.avatar ?? undefined} alt={peer.name} />
            <AvatarFallback className="bg-wa-panel-3 text-lg">
              {(peer.name ?? "??").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-lg font-medium text-wa-text">{peer.name}</p>
          <p className="flex items-center gap-1 text-xs text-wa-text-muted">
            {offer.type === CallType.VIDEO ? (
              <Video className="size-3" />
            ) : (
              <Phone className="size-3" />
            )}
            {offer.type === CallType.VIDEO ? COPY.CALL_VIDEO : COPY.CALL_VOICE}
          </p>

          <div className="mt-2 flex items-center gap-4">
            <Button
              size="icon-lg"
              onClick={onDecline}
              loading={update.isPending}
              aria-label={COPY.CALL_DECLINE}
              className="rounded-full bg-wa-danger text-white hover:bg-wa-danger/90"
            >
              <PhoneOff className="size-5" />
            </Button>
            <Button
              size="icon-lg"
              onClick={onAnswer}
              loading={update.isPending}
              aria-label={COPY.CALL_ANSWER}
              className="rounded-full bg-wa-green text-white hover:bg-wa-green/90"
            >
              <Phone className="size-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
