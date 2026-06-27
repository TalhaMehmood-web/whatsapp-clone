"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  PhoneMissed,
  Video,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { CallStatus, CallType } from "@/models/enums";
import { chatListTime } from "@/utils/date-format";
import { COPY } from "@/config/constants";
import { cn } from "@/utils/cn";
import { CallbackConfirmDialog } from "./callback-confirm-dialog";

// Row in the calls log. WhatsApp Web behaviour: tapping a past call
// surfaces a confirm dialog (peer + type) before placing a new call —
// it never silently redials. The dialog itself fires useStartCallMutation
// and navigates into the new call on success.
export function CallLogItem({ entry }) {
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const peers = entry.participants.filter((p) => p.id !== user?.id);
  const display = peers[0] ?? { name: "Unknown" };

  const initials = (display.name ?? "??").slice(0, 2).toUpperCase();
  const missed =
    entry.status === CallStatus.MISSED || entry.status === CallStatus.DECLINED;
  // We're the receiver whenever the caller was somebody else.
  const incoming = entry.callerId && entry.callerId !== user?.id;

  // Guard: don't open the dialog when we can't actually place the call
  // (peer unknown, or the row is a group placeholder with no id). The
  // row stays clickable for keyboard a11y but the open is a no-op.
  const canCallBack = !!display.id;

  return (
    <>
      <button
        type="button"
        onClick={() => canCallBack && setConfirmOpen(true)}
        disabled={!canCallBack}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-wa-panel-2 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent",
        )}
      >
        <Avatar className="size-12">
          <AvatarImage src={display.avatar ?? undefined} alt={display.name} />
          <AvatarFallback className="bg-wa-panel-3 text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "truncate text-sm",
              missed ? "text-wa-danger" : "text-wa-text",
            )}
          >
            {display.name}
          </span>
          <span className="flex items-center gap-1 text-xs text-wa-text-muted">
            {missed ? (
              <PhoneMissed className="size-3" />
            ) : incoming ? (
              <ArrowDownLeft className="size-3 text-wa-green" />
            ) : (
              <ArrowUpRight className="size-3 text-wa-green" />
            )}
            <span className="truncate">
              {labelFor(entry.status)} ·{" "}
              {chatListTime(entry.startedAt ?? entry.createdAt)}
            </span>
          </span>
        </div>

        {entry.type === CallType.VIDEO ? (
          <Video className="size-5 text-wa-text-muted" />
        ) : (
          <Phone className="size-5 text-wa-text-muted" />
        )}
      </button>

      {canCallBack && (
        <CallbackConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          peer={display}
          type={entry.type}
          lastCallAt={entry.startedAt ?? entry.createdAt}
        />
      )}
    </>
  );
}

function labelFor(status) {
  switch (status) {
    case CallStatus.MISSED:
      return COPY.CALL_MISSED;
    case CallStatus.DECLINED:
      return COPY.CALL_DECLINED;
    case CallStatus.ANSWERED:
      return COPY.CALL_ANSWERED;
    case CallStatus.ONGOING:
      return COPY.CALL_ONGOING;
    default:
      return "";
  }
}
