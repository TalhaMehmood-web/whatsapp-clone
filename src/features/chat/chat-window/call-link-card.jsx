"use client";

import { useRouter } from "next/navigation";
import { Phone, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useJoinCallLinkMutation } from "@/tanstack/calls/mutations";
import { CallType } from "@/models/enums";
import { ROUTES } from "@/config/constants";
import { cn } from "@/utils/cn";

// Specialised bubble shown when the message carries `metadata.kind ===
// "call-link"`. Mirrors WhatsApp Web's call-link card: a small "call.
// whatsapp.com" caption, the URL, and a tappable Join call CTA that
// drops the user into the call screen.
export function CallLinkCard({ message, isOutgoing }) {
  const router = useRouter();
  const meta = message.metadata ?? {};
  const join = useJoinCallLinkMutation();
  const url = message.content ?? "";
  const isVideo = meta.callType === CallType.VIDEO;
  const TypeIcon = isVideo ? Video : Phone;

  const onJoin = () => {
    join.mutate(
      {
        callId: meta.callId,
        type: meta.callType,
        participantIds: meta.participantIds ?? [],
      },
      {
        onSuccess: (call) => {
          router.push(`${ROUTES.CALLS}/${call.id}`);
        },
        onError: (err) =>
          toast.error(
            err.response?.data?.error ?? "Could not join the call",
          ),
      },
    );
  };

  return (
    <div className="flex min-w-[16rem] max-w-xs flex-col gap-1.5 text-sm">
      <div className="flex items-center gap-2 text-wa-text-muted">
        <TypeIcon className="size-4" />
        <span className="text-[11px] font-medium uppercase tracking-wide">
          call.whatsapp.com
        </span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "block truncate text-xs",
          isOutgoing ? "text-white/80" : "text-wa-text-muted",
        )}
      >
        {url}
      </a>
      <div className="-mx-2.5 mt-1 border-t border-white/10" />
      <Button
        type="button"
        variant="ghost"
        onClick={onJoin}
        loading={join.isPending}
        className="-mb-1.5 w-full justify-center rounded-md text-sm font-medium text-wa-green hover:bg-white/10 hover:text-wa-green"
      >
        Join call
      </Button>
    </div>
  );
}
