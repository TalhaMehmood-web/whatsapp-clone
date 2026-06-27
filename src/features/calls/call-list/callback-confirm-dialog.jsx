"use client";

import { useRouter } from "next/navigation";
import { Phone, Video } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useStartCallMutation } from "@/tanstack/calls/mutations";
import { CallType } from "@/models/enums";
import { ROUTES, COPY } from "@/config/constants";
import { chatListTime } from "@/utils/date-format";

// Confirm dialog shown when the user clicks a row in the calls log.
// Mirrors WhatsApp's flow: tapping a past call doesn't redial silently
// — it surfaces the peer + call type so the user can confirm before a
// new call is placed.
//
// `peer` is the other participant ({ id, name, avatar }); `type` is
// the original CallType (VOICE/VIDEO). On confirm we start a fresh
// call to that peer with the same type and navigate into it.
export function CallbackConfirmDialog({
  open,
  onOpenChange,
  peer,
  type,
  lastCallAt,
}) {
  const router = useRouter();
  const startCall = useStartCallMutation();

  const initials = (peer?.name ?? "??").slice(0, 2).toUpperCase();
  const isVideo = type === CallType.VIDEO;

  const onConfirm = () => {
    if (!peer?.id || startCall.isPending) return;
    startCall.mutate(
      { participantIds: [peer.id], type },
      {
        onSuccess: (call) => {
          onOpenChange(false);
          router.push(`${ROUTES.CALLS}/${call.id}`);
        },
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Could not start call"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <Avatar className="mx-auto size-20">
            <AvatarImage src={peer?.avatar ?? undefined} alt={peer?.name} />
            <AvatarFallback className="bg-wa-panel-3 text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="mt-3 text-center text-lg">
            {isVideo ? "Video call" : "Voice call"} {peer?.name}?
          </DialogTitle>
          <DialogDescription className="text-center">
            {lastCallAt
              ? `Last call · ${chatListTime(lastCallAt)}`
              : "Start a new call now."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row justify-center gap-2 sm:justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={startCall.isPending}
          >
            {COPY.CONFIRM_CANCEL}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            loading={startCall.isPending}
            loadingText="Calling…"
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            {isVideo ? (
              <Video className="mr-2 size-4" />
            ) : (
              <Phone className="mr-2 size-4" />
            )}
            Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
