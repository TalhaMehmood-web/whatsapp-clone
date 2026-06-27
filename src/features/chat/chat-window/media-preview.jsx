"use client";

import { Loader2, Play } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageType } from "@/models/enums";
import { useUiStore } from "@/stores/ui-store";
import { useChatPrefsQuery } from "@/tanstack/users/queries";
import { queryKeys } from "@/config/query-keys";
import { documentIcon } from "@/utils/document-icon";
import { cn } from "@/utils/cn";

import { VoiceNotePlayer } from "./voice-note-player";

// Project to just the one flag we need so changing wallpaper/theme/etc.
// doesn't re-render every single message bubble in the open chat.
const selectVideoPreload = (prefs) =>
  prefs?.autoDownloadVideos === false ? "none" : "metadata";

// Renders the media portion of a message bubble. The bubble itself is in
// message-bubble; this is purely the asset preview (no caption, no time).
//
// Images and videos open in a full-screen lightbox with prev/next nav over
// every other image/video in the same chat.
export function MediaPreview({ message, className }) {
  const qc = useQueryClient();
  const openLightbox = useUiStore((s) => s.openLightbox);
  const openDocPreview = useUiStore((s) => s.openDocPreview);
  // Auto-download flags only control the *preload* behaviour: image
  // bytes are always lazy-loaded, and videos only prefetch metadata
  // when the user has opted in. This trims data usage on chats that
  // are heavy on media without breaking the click-to-open flow.
  const { data: videoPreload } = useChatPrefsQuery({
    select: selectVideoPreload,
  });

  if (!message?.mediaUrl) return null;

  // While the file is uploading the optimistic message carries a
  // 0..1 progress number written by use-media-upload. The bubble shows
  // a dim + ring overlay until the server row swaps in.
  const isUploading =
    !!message.__optimistic && typeof message.__uploadProgress === "number";
  const uploadProgress = isUploading ? message.__uploadProgress : 1;

  const openCarousel = () => {
    const cache = qc.getQueryData(queryKeys.messages.list(message.chatId));
    // Walk every cached page (oldest first) so the carousel matches scroll
    // order; fall back to just this message if the cache isn't primed.
    const allMessages =
      cache?.pages
        ?.slice()
        ?.reverse()
        ?.flatMap((p) => p.messages) ?? [message];
    const items = allMessages.filter(
      (m) =>
        !m.deletedAt &&
        m.mediaUrl &&
        (m.type === MessageType.IMAGE || m.type === MessageType.VIDEO),
    );
    const index = Math.max(0, items.findIndex((m) => m.id === message.id));
    openLightbox({ items, index });
  };

  switch (message.type) {
    case MessageType.IMAGE:
      return (
        <button
          type="button"
          onClick={isUploading ? undefined : openCarousel}
          disabled={isUploading}
          className={cn(
            "relative block w-full overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-green",
            className,
          )}
        >
          <img
            src={message.mediaUrl}
            alt={message.caption ?? ""}
            loading="lazy"
            // `object-contain` so portraits + landscapes both render at
            // their real aspect ratio inside the bubble — the previous
            // `object-cover` cropped tall photos to a strip.
            className={cn(
              "max-h-80 w-full object-contain transition-[filter]",
              isUploading
                ? "cursor-default brightness-50"
                : "cursor-zoom-in",
            )}
          />
          {isUploading && <UploadOverlay progress={uploadProgress} />}
        </button>
      );

    case MessageType.VIDEO:
      return (
        <button
          type="button"
          onClick={isUploading ? undefined : openCarousel}
          disabled={isUploading}
          className={cn(
            "relative block w-full overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-green",
            className,
          )}
          aria-label="Play video"
        >
          <video
            src={message.mediaUrl}
            preload={videoPreload}
            playsInline
            muted
            // Same reason as the image branch: default video object-fit
            // is `fill` which distorts. `contain` keeps the original
            // aspect ratio inside the bubble.
            className={cn(
              "max-h-80 w-full object-contain transition-[filter]",
              isUploading && "brightness-50",
            )}
          />
          {isUploading ? (
            <UploadOverlay progress={uploadProgress} />
          ) : (
            <span className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="grid size-12 place-items-center rounded-full bg-black/60 text-white">
                <Play className="size-5" />
              </span>
            </span>
          )}
        </button>
      );

    case MessageType.AUDIO:
      return (
        <audio
          src={message.mediaUrl}
          controls
          className={cn("w-64", className)}
        />
      );

    case MessageType.VOICE_NOTE:
      return (
        <VoiceNotePlayer
          src={message.mediaUrl}
          durationSec={message.mediaDuration ?? null}
          seed={message.id}
          className={className}
        />
      );

    case MessageType.DOCUMENT: {
      const { Icon, accent } = documentIcon({
        mime: message.mediaMime,
        fileName: message.fileName,
      });
      const inner = (
        <>
          {isUploading ? (
            <Loader2 className="size-8 shrink-0 animate-spin text-wa-text-muted" />
          ) : (
            <Icon className={cn("size-8 shrink-0", accent)} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-wa-text">
              {message.fileName ?? "Document"}
            </p>
            <p className="truncate text-xs text-wa-text-muted">
              {isUploading
                ? `Uploading… ${Math.round(uploadProgress * 100)}%`
                : message.mediaSizeBytes != null
                  ? formatBytes(message.mediaSizeBytes)
                  : null}
            </p>
          </div>
        </>
      );
      const wrapperClass = cn(
        "flex w-64 items-center gap-3 rounded-md bg-wa-panel-2 p-3 text-left transition-colors",
        !isUploading && "hover:bg-wa-panel-3",
        className,
      );
      if (isUploading) {
        return <div className={wrapperClass}>{inner}</div>;
      }
      return (
        <button
          type="button"
          onClick={() =>
            openDocPreview({
              mediaUrl: message.mediaUrl,
              mediaMime: message.mediaMime,
              fileName: message.fileName,
            })
          }
          className={wrapperClass}
        >
          {inner}
        </button>
      );
    }

    default:
      return null;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Circular progress ring centred over an image/video thumbnail while the
// upload is in flight. The track stays dim grey and the green arc grows
// clockwise from 0 to 100% as Cloudinary acks bytes — matches the
// WhatsApp Web treatment.
function UploadOverlay({ progress }) {
  const clamped = Math.max(0, Math.min(1, progress ?? 0));
  const RADIUS = 22;
  const CIRC = 2 * Math.PI * RADIUS;
  const dash = CIRC * (1 - clamped);
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center">
      <span className="relative grid size-14 place-items-center">
        <svg
          viewBox="0 0 56 56"
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="28"
            cy="28"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="4"
          />
          <circle
            cx="28"
            cy="28"
            r={RADIUS}
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dash}
            className="transition-[stroke-dashoffset] duration-200 ease-out"
          />
        </svg>
        <span className="text-xs font-medium text-white">
          {Math.round(clamped * 100)}%
        </span>
      </span>
    </span>
  );
}
