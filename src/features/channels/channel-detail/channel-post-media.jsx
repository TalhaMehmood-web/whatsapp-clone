"use client";

import { Download, Play } from "lucide-react";

import { useUiStore } from "@/stores/ui-store";
import { MessageType } from "@/models/enums";
import { documentIcon } from "@/utils/document-icon";
import { downloadCloudinaryUrl } from "@/utils/cloudinary-url";
import { cn } from "@/utils/cn";

// Channel-post media renderer. Mirrors MediaPreview's UI but doesn't
// couple to the chat messages cache — channel posts live under a
// different React Query key, so the chat-style "open in lightbox over
// every cached chat image" logic doesn't apply here.
//
// Images open in a full-screen lightbox keyed by JUST this post (no
// carousel — channels are usually single-author broadcasts so flicking
// between posts via the lightbox would be confusing).
//
// Docs route to the same DocumentPreviewer host the chat uses.
export function ChannelPostMedia({ post }) {
  const openLightbox = useUiStore((s) => s.openLightbox);
  const openDocPreview = useUiStore((s) => s.openDocPreview);
  if (!post?.mediaUrl) return null;

  switch (post.type) {
    case MessageType.IMAGE:
      return (
        <button
          type="button"
          onClick={() =>
            openLightbox({
              items: [
                {
                  id: post.id,
                  type: post.type,
                  mediaUrl: post.mediaUrl,
                  caption: post.content,
                },
              ],
              index: 0,
            })
          }
          className="mt-3 block w-full overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-green"
        >
          <img
            src={post.mediaUrl}
            alt={post.content ?? ""}
            loading="lazy"
            // `object-contain` so a tall portrait isn't cropped to a
            // 96-tall strip. Bubble background covers the letterbox.
            className="max-h-96 w-full cursor-zoom-in object-contain"
          />
        </button>
      );

    case MessageType.VIDEO:
      return (
        <div className="relative mt-3 overflow-hidden rounded-md bg-black">
          <video
            src={post.mediaUrl}
            controls
            preload="metadata"
            playsInline
            // Default <video> object-fit is `fill` — distorts. `contain`
            // keeps aspect; the black bubble background is the letterbox.
            className="max-h-96 w-full object-contain"
          />
        </div>
      );

    case MessageType.AUDIO:
      return (
        <audio
          src={post.mediaUrl}
          controls
          className="mt-3 w-full"
        />
      );

    case MessageType.DOCUMENT: {
      const { Icon, accent } = documentIcon({
        mime: post.mediaMime,
        fileName: post.fileName,
      });
      return (
        <div className="mt-3 flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              openDocPreview({
                mediaUrl: post.mediaUrl,
                mediaMime: post.mediaMime,
                fileName: post.fileName,
              })
            }
            className="flex flex-1 items-center gap-3 rounded-md bg-wa-panel-2 p-3 text-left transition-colors hover:bg-wa-panel-3"
          >
            <Icon className={cn("size-8 shrink-0", accent)} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-wa-text">
                {post.fileName ?? "Document"}
              </span>
              <span className="truncate text-xs text-wa-text-muted">
                {formatBytes(post.mediaSizeBytes ?? 0)}
              </span>
            </div>
            <Play className="size-4 text-wa-text-muted" />
          </button>
          <a
            href={downloadCloudinaryUrl(post.mediaUrl, post.fileName)}
            rel="noreferrer"
            aria-label="Download"
            className="grid size-10 place-items-center rounded-md text-wa-text-muted transition-colors hover:bg-wa-panel-2 hover:text-wa-text"
          >
            <Download className="size-4" />
          </a>
        </div>
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
