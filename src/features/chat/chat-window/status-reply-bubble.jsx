"use client";

import { Camera, Video } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import { MessageMetadataKind, StatusType } from "@/models/enums";
import { ROUTES } from "@/config/constants";
import { cn } from "@/utils/cn";

// Inline header card rendered above a status-reply message's text. Shows
// the original status as a quoted snippet (small media tile for image /
// video, or the bg + text snippet for text statuses). Tapping it routes
// to the status viewer for that author so the user can replay it.
//
// Mirrors WhatsApp Web's "You · Status" / "<peer> · Status" bubble.
export function StatusReplyHeader({ message, isOutgoing }) {
  const { user } = useAuth();
  const meta = message.metadata ?? {};
  if (meta.kind !== MessageMetadataKind.STATUS_REPLY) return null;

  const isMine = meta.authorId === user?.id;
  const label = isOutgoing
    ? `${isMine ? "You" : message.sender?.name ?? "You"} · Status`
    : `${message.sender?.name ?? "Status"} · Status`;
  // Map the original status author to the route. When the author is me,
  // the viewer's "me" synthetic bucket holds my reel — using my real
  // user id would land on a non-existent author. We also pass the
  // specific status id so the viewer can jump straight to that story
  // instead of restarting from the author's first one.
  const viewerAuthorId = isMine ? "me" : meta.authorId;
  const href = meta.statusId
    ? `${ROUTES.STATUS}/${viewerAuthorId}?status=${meta.statusId}`
    : `${ROUTES.STATUS}/${viewerAuthorId}`;

  return (
    <Link
      href={href}
      className={cn(
        "mb-1 flex items-center gap-2 rounded-md border-l-4 px-2 py-1.5 transition-colors hover:bg-black/15",
        isOutgoing
          ? "border-white/40 bg-black/15"
          : "border-wa-green bg-black/15",
      )}
    >
      <StatusThumb meta={meta} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-medium text-wa-green">{label}</span>
        <StatusSnippet meta={meta} />
      </div>
    </Link>
  );
}

function StatusThumb({ meta }) {
  if (meta.statusType === StatusType.TEXT) {
    return (
      <span
        className="grid size-9 shrink-0 place-items-center rounded-md text-[10px] text-white"
        style={{ backgroundColor: meta.statusBgColor ?? "#005c4b" }}
      >
        Aa
      </span>
    );
  }
  if (meta.statusMediaUrl) {
    return (
      <span className="relative grid size-9 shrink-0 overflow-hidden rounded-md bg-black/40">
        {meta.statusType === StatusType.VIDEO ? (
          <Video
            className="absolute inset-0 m-auto z-10 size-4 text-white"
            aria-hidden
          />
        ) : null}
        {/* Plain img — small enough that lazy + decode async is fine. */}
        <img
          src={meta.statusMediaUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
      </span>
    );
  }
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-black/40 text-white">
      <Camera className="size-4" />
    </span>
  );
}

function StatusSnippet({ meta }) {
  if (meta.statusType === StatusType.TEXT) {
    return (
      <span className="truncate text-[12px] text-wa-text-muted">
        {meta.statusPreview || "Text status"}
      </span>
    );
  }
  if (meta.statusType === StatusType.VIDEO) {
    return (
      <span className="flex items-center gap-1 truncate text-[12px] text-wa-text-muted">
        <Video className="size-3" />
        {meta.statusPreview || "Video status"}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 truncate text-[12px] text-wa-text-muted">
      <Camera className="size-3" />
      {meta.statusPreview || "Photo status"}
    </span>
  );
}
