"use client";

import Link from "next/link";
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
import { COPY, ROUTES } from "@/config/constants";
import { cn } from "@/utils/cn";

export function CallLogItem({ entry }) {
  const { user } = useAuth();
  const peers = entry.participants.filter((p) => p.id !== user?.id);
  const display = peers[0] ?? { name: "Unknown" };

  const initials = (display.name ?? "??").slice(0, 2).toUpperCase();
  const missed =
    entry.status === CallStatus.MISSED || entry.status === CallStatus.DECLINED;
  // We're the receiver whenever the caller was somebody else.
  const incoming = entry.callerId && entry.callerId !== user?.id;

  return (
    <Link
      href={`${ROUTES.CALLS}/${entry.id}`}
      className={cn(
        "flex items-center gap-3 px-3 py-3 transition-colors hover:bg-wa-panel-2",
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
    </Link>
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
