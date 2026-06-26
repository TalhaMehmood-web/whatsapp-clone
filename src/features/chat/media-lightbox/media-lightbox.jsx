"use client";

import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { MessageType } from "@/models/enums";
import { messageTime } from "@/utils/date-format";

// Full-screen media viewer. Mounted once at the (main) layout; opened by
// message bubbles when the user clicks an image or video. The carousel is
// the list of media items in the current chat — left/right arrows + the
// arrow keys move between them.
export function MediaLightboxHost() {
  const lightbox = useUiStore((s) => s.lightbox);
  const setIndex = useUiStore((s) => s.setLightboxIndex);
  const close = useUiStore((s) => s.closeLightbox);

  const items = lightbox?.items ?? [];
  const index = lightbox?.index ?? 0;
  const current = items[index] ?? null;

  const goPrev = useMemo(
    () => () => setIndex(Math.max(0, index - 1)),
    [index, setIndex],
  );
  const goNext = useMemo(
    () => () => setIndex(Math.min(items.length - 1, index + 1)),
    [index, items.length, setIndex],
  );

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, goPrev, goNext, close]);

  if (!lightbox || !current) return null;

  const sender = current.sender ?? {};
  const initials = (sender.name ?? "??").slice(0, 2).toUpperCase();
  const canPrev = index > 0;
  const canNext = index < items.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
      role="dialog"
      aria-modal="true"
    >
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={sender.avatar ?? undefined} alt={sender.name} />
            <AvatarFallback className="bg-wa-panel-3 text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm">{sender.name ?? "Unknown"}</p>
            <p className="truncate text-[11px] text-white/70">
              {messageTime(current.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Download"
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <a
              href={current.mediaUrl}
              download={current.fileName ?? undefined}
              target="_blank"
              rel="noreferrer"
            >
              <Download className="size-5" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={close}
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </Button>
        </div>
      </header>

      <div className="relative flex flex-1 items-center justify-center px-4">
        {canPrev && (
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Previous"
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronLeft className="size-6" />
          </Button>
        )}

        <MediaContent message={current} />

        {canNext && (
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Next"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronRight className="size-6" />
          </Button>
        )}
      </div>

      {current.caption && (
        <footer className="px-6 pb-6 pt-2 text-center text-sm text-white/90">
          {current.caption}
        </footer>
      )}
    </div>
  );
}

function MediaContent({ message }) {
  if (message.type === MessageType.VIDEO) {
    return (
      <video
        key={message.id}
        src={message.mediaUrl}
        controls
        autoPlay
        className="max-h-[80vh] max-w-full"
      />
    );
  }
  return (
    <img
      key={message.id}
      src={message.mediaUrl}
      alt={message.caption ?? ""}
      className="max-h-[80vh] max-w-full object-contain"
    />
  );
}
