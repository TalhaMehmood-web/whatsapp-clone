"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  PhoneMissed,
  Video,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { CallStatus, CallType } from "@/models/enums";
import { messageTime } from "@/utils/date-format";
import { COPY, ROUTES } from "@/config/constants";

// Centered call summary bubble inside the chat, matching WhatsApp's
// "Voice call · 02:14" / "Missed voice call" style. Tappable — links into
// the dedicated call detail screen.
export function CallSystemBubble({ message }) {
  const { user } = useAuth();
  const meta = message.metadata ?? {};
  const isVideo = meta.callType === CallType.VIDEO;
  const status = meta.callStatus;
  const incoming = meta.callerId && meta.callerId !== user?.id;
  const missed =
    status === CallStatus.MISSED || status === CallStatus.DECLINED;

  const ArrowIcon = missed
    ? PhoneMissed
    : incoming
      ? ArrowDownLeft
      : ArrowUpRight;
  const TypeIcon = isVideo ? Video : Phone;

  return (
    <div className="my-2 flex w-full justify-center px-3">
      <Link
        href={meta.callId ? `${ROUTES.CALLS}/${meta.callId}` : ROUTES.CALLS}
        className="flex w-full max-w-xs items-center gap-3 rounded-lg bg-wa-panel-2 px-3 py-2 shadow-sm transition-colors hover:bg-wa-panel-3"
      >
        <span
          className={
            missed
              ? "grid size-9 shrink-0 place-items-center rounded-full bg-wa-danger/15 text-wa-danger"
              : "grid size-9 shrink-0 place-items-center rounded-full bg-wa-green-soft text-wa-green"
          }
        >
          <TypeIcon className="size-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm text-wa-text">
            {labelFor({ isVideo, status, incoming })}
          </span>
          <span className="flex items-center gap-1 truncate text-[11px] text-wa-text-muted">
            <ArrowIcon
              className={
                missed
                  ? "size-3 text-wa-danger"
                  : "size-3 text-wa-green"
              }
            />
            {detailFor({ status, durationSec: meta.durationSec ?? 0 })}
            <span>·</span>
            {messageTime(message.createdAt)}
          </span>
        </div>
      </Link>
    </div>
  );
}

function labelFor({ isVideo, status, incoming }) {
  const kind = isVideo ? COPY.CALL_VIDEO : COPY.CALL_VOICE;
  if (status === CallStatus.MISSED) {
    return incoming ? `Missed ${kind.toLowerCase()}` : `No answer · ${kind}`;
  }
  if (status === CallStatus.DECLINED) {
    return `Declined ${kind.toLowerCase()}`;
  }
  return kind;
}

function detailFor({ status, durationSec }) {
  if (status === CallStatus.MISSED) return COPY.CALL_MISSED;
  if (status === CallStatus.DECLINED) return COPY.CALL_DECLINED;
  if (!durationSec) return COPY.CALL_ANSWERED;
  return formatDuration(durationSec);
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
