"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageCircle,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStatusFeedQuery } from "@/tanstack/status/queries";
import {
  useDeleteStatusMutation,
  useViewStatusMutation,
} from "@/tanstack/status/mutations";
import { useStartChatMutation } from "@/tanstack/chat/mutations";
import { StatusViewersSheet } from "./status-viewers-sheet";
import { StatusReplyComposer } from "./status-reply-composer";
import { useAuth } from "@/hooks/use-auth";
import { COPY, ROUTES, STATUS_VIEWER } from "@/config/constants";
import { StatusType } from "@/models/enums";
import { statusTime } from "@/utils/date-format";
import { StatusProgressBars } from "./status-progress-bars";

const TICK_MS = 50;

export function StatusViewer({ authorId }) {
  const router = useRouter();
  const params = useSearchParams();
  // Optional deep-link to a specific story (status-reply preview cards
  // and notifications pass `?status=<id>`). When the id is missing or no
  // longer alive, we fall back to the author's first story.
  const targetStatusId = params.get("status");
  const { data } = useStatusFeedQuery();
  const { user } = useAuth();
  const view = useViewStatusMutation(authorId);
  const del = useDeleteStatusMutation();
  const startChat = useStartChatMutation();
  const [viewersOpen, setViewersOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef(null);

  // Build the ordered list of authors to view (contacts + my own).
  const authors = useMemo(() => {
    if (!data) return [];
    const contacts = data.contacts ?? [];
    const list = contacts.map((c) => ({
      user: c.user,
      statuses: c.statuses,
    }));
    if (data.mine?.length) {
      list.unshift({
        user: {
          id: "me",
          name: user?.name ?? "You",
          avatar: user?.avatar ?? null,
        },
        statuses: data.mine,
      });
    }
    return list;
  }, [data, user]);

  // Normalise the route param: the synthetic "me" bucket and the
  // current user's real id should both resolve to my own reel. That
  // way deep links from status-reply cards (which carry the real
  // authorId) still land on the correct slot.
  const normalisedAuthorId =
    authorId === user?.id || authorId === "me" ? "me" : authorId;
  const authorIndex = authors.findIndex(
    (a) => a.user.id === normalisedAuthorId,
  );
  const author = authorIndex >= 0 ? authors[authorIndex] : null;

  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const lastViewedId = useRef(null);
  // True when the route asked for a specific status id but it's no
  // longer in this author's live feed (expired or deleted).
  const [targetMissing, setTargetMissing] = useState(false);

  // Reset when the author or the targeted status changes. If a target
  // is supplied, try to jump straight to that story; otherwise start
  // from the first.
  useEffect(() => {
    if (!author) return;
    setProgress(0);
    setPaused(false);
    if (targetStatusId) {
      const idx = author.statuses.findIndex((s) => s.id === targetStatusId);
      if (idx >= 0) {
        setStoryIndex(idx);
        setTargetMissing(false);
        return;
      }
      // Not found = the original status has expired or been deleted.
      setTargetMissing(true);
      setStoryIndex(0);
      return;
    }
    setTargetMissing(false);
    setStoryIndex(0);
  }, [authorId, targetStatusId, author]);

  const story = author?.statuses?.[storyIndex] ?? null;
  const duration =
    story?.mediaDuration != null && story.mediaDuration > 0
      ? story.mediaDuration * 1000
      : STATUS_VIEWER.DEFAULT_DURATION_MS;

  // Auto-advance ticker. Pauses while the viewers sheet is open or the
  // user has tapped pause.
  useEffect(() => {
    if (!story) return undefined;
    if (viewersOpen || paused) return undefined;
    const start = Date.now();
    const startedAt = progress * duration; // resume from where we paused
    const id = setInterval(() => {
      const elapsed = startedAt + (Date.now() - start);
      const p = elapsed / duration;
      if (p >= 1) {
        clearInterval(id);
        goNext();
      } else {
        setProgress(p);
      }
    }, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, duration, viewersOpen, paused]);

  // Keep the underlying video element in sync with paused state.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, story?.id]);

  // Mark each story as viewed once, the first time we land on it.
  useEffect(() => {
    if (!story || story.id === lastViewedId.current) return;
    lastViewedId.current = story.id;
    if (author?.user?.id !== "me") view.mutate(story.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  const goNext = () => {
    if (!author) return;
    if (storyIndex + 1 < author.statuses.length) {
      setStoryIndex((i) => i + 1);
      setProgress(0);
      setPaused(false);
      return;
    }
    const next = authors[authorIndex + 1];
    if (next) router.replace(`${ROUTES.STATUS}/${next.user.id}`);
    else router.replace(ROUTES.STATUS);
  };

  const goPrev = () => {
    if (!author) return;
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setProgress(0);
      setPaused(false);
      return;
    }
    const prev = authors[authorIndex - 1];
    if (prev) router.replace(`${ROUTES.STATUS}/${prev.user.id}`);
  };

  if (!author || !story) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-wa-text-muted">
        Nothing to show.
      </div>
    );
  }

  // The route asked for a specific status that's expired/deleted — show
  // a dedicated message instead of silently playing a different story.
  if (targetMissing) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black text-center text-wa-text-muted">
        <p className="text-base text-white">This status is no longer available.</p>
        <p className="text-sm text-white/60">
          It may have expired (24h) or been deleted.
        </p>
        <Button
          variant="ghost"
          onClick={() => router.replace(ROUTES.STATUS)}
          className="mt-2 text-white/80 hover:bg-white/10 hover:text-white"
        >
          Back to status
        </Button>
      </div>
    );
  }

  const isMine = author.user.id === "me";
  const peerName = isMine ? "You" : author.user.name;
  const initials = (peerName ?? "??").slice(0, 2).toUpperCase();
  const viewerCount = isMine ? (story.views?.length ?? 0) : 0;
  const isText = story.type === StatusType.TEXT;
  const isVideo = story.type === StatusType.VIDEO;
  const isImage = !isText && !isVideo;

  // Backdrop behaviour mirrors WhatsApp Web:
  //   - TEXT:  whole viewer takes the chosen bgColor.
  //   - IMAGE/VIDEO: a blurred, dimmed copy of the asset fills the
  //                  screen behind the centered column.
  const backdropStyle = isText
    ? { backgroundColor: story.bgColor ?? "#005c4b" }
    : { backgroundColor: "#000" };

  const onDelete = () => {
    del.mutate(story.id, {
      onSuccess: () => {
        if (author.statuses.length <= 1) router.replace(ROUTES.STATUS);
        else goNext();
      },
    });
  };

  const hasPrev = storyIndex > 0 || authorIndex > 0;
  const hasNext =
    storyIndex < author.statuses.length - 1 ||
    authorIndex < authors.length - 1;

  return (
    // Fixed overlay covering the nav rail + list pane, matching WhatsApp
    // Web's full-screen status viewer. Sits above everything else via z-50.
    <div
      className="fixed inset-0 z-50 flex items-stretch"
      style={backdropStyle}
    >
      {/* Blurred backdrop for image/video statuses — a heavily blurred &
          dimmed copy of the same asset fills the viewport behind the
          centered column, matching the WhatsApp Web look. */}
      {(isImage || isVideo) && story.mediaUrl && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
        >
          {isVideo ? (
            <video
              key={`bg-${story.id}`}
              src={story.mediaUrl}
              autoPlay
              muted
              playsInline
              className="size-full scale-110 object-cover opacity-40 blur-3xl"
            />
          ) : (
            <img
              src={story.mediaUrl}
              alt=""
              className="size-full scale-110 object-cover opacity-40 blur-3xl"
            />
          )}
        </div>
      )}

      {/* Outer chevrons — circular dark pills outside the viewer column,
          matching the WA Web layout in the screenshots. */}
      {hasPrev && (
        <button
          type="button"
          aria-label="Previous"
          onClick={goPrev}
          className="absolute left-4 top-1/2 z-30 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          aria-label="Next"
          onClick={goNext}
          className="absolute right-4 top-1/2 z-30 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
        >
          <ChevronRight className="size-5" />
        </button>
      )}

      {/* Centered viewer column. Width is constrained on wide screens so
          the chevrons sit outside it. */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-2xl flex-col">
        <StatusProgressBars
          count={author.statuses.length}
          index={storyIndex}
          progress={progress}
        />

        {/* Top scrim — a dark-to-transparent gradient behind the header
            so the avatar/name/icons stay legible no matter how bright
            or busy the media beneath is. Pointer-events-none so it
            doesn't intercept clicks meant for the header buttons. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-linear-to-b from-black/60 to-transparent"
        />

        <header className="absolute left-0 right-0 top-6 z-20 flex items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage
                src={author.user.avatar ?? undefined}
                alt={peerName}
              />
              <AvatarFallback className="bg-wa-panel-3 text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-white">{peerName}</span>
              <span className="truncate text-[11px] text-white/70">
                {statusTime(story.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Pause / play — works for every status type. WhatsApp Web
                shows it on text + image + video alike. */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={paused ? "Play" : "Pause"}
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? (
                <Play className="size-5" />
              ) : (
                <Pause className="size-5" />
              )}
            </Button>
            {isVideo && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={muted ? "Unmute" : "Mute"}
                className="text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? (
                  <VolumeX className="size-5" />
                ) : (
                  <Volume2 className="size-5" />
                )}
              </Button>
            )}
            {isMine && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete status"
                className="text-white/80 hover:bg-white/10 hover:text-white"
                onClick={onDelete}
                disabled={del.isPending}
              >
                <Trash2 className="size-5" />
              </Button>
            )}
            {!isMine && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="More"
                    className="text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <MoreVertical className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      const handle = author.user?.handle;
                      if (!handle) {
                        toast.info("This user has no public profile yet.");
                        return;
                      }
                      router.replace(ROUTES.PROFILE(handle));
                    }}
                  >
                    <User className="mr-2 size-4" /> View profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      startChat.mutate(author.user.id, {
                        onSuccess: (chat) =>
                          router.replace(ROUTES.CHAT_DETAIL(chat.id)),
                        onError: (err) =>
                          toast.error(
                            err.response?.data?.error ?? "Couldn't open chat",
                          ),
                      })
                    }
                  >
                    <MessageCircle className="mr-2 size-4" /> Message
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      toast.success("Thanks for the report — moderation will review.")
                    }
                    className="text-wa-danger focus:text-wa-danger"
                  >
                    <AlertTriangle className="mr-2 size-4" /> Report status
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => router.replace(ROUTES.STATUS)}
            >
              <X className="size-5" />
            </Button>
          </div>
        </header>

        <div className="relative flex flex-1 items-center justify-center">
          <StoryContent
            story={story}
            muted={muted}
            paused={paused}
            videoRef={videoRef}
          />

          {/* Caption overlay for IMAGE/VIDEO statuses (TEXT stories
              render their content inside StoryContent). Sits above the
              footer with its own readability scrim so the text stays
              legible on any media. */}
          {!isText && story.caption && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-4">
              <p className="mx-auto max-w-xl rounded-lg bg-black/55 px-4 py-2 text-center text-sm leading-relaxed text-white">
                {story.caption}
              </p>
            </div>
          )}
        </div>

        <footer className="z-20 flex h-16 shrink-0 items-center gap-3 px-4 pb-4">
          {isMine ? (
            <button
              type="button"
              onClick={() => setViewersOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 py-2 text-sm text-white/90 transition-colors hover:bg-white/20"
            >
              <Eye className="size-4" />
              {viewerCount === 0
                ? "No views yet"
                : viewerCount === 1
                  ? "1 view"
                  : `${viewerCount} views`}
            </button>
          ) : (
            <StatusReplyComposer
              authorId={author.user.id}
              status={story}
              onSendingChange={setPaused}
            />
          )}
        </footer>

        {isMine && (
          <StatusViewersSheet
            statusId={story.id}
            open={viewersOpen}
            onOpenChange={setViewersOpen}
          />
        )}
      </div>
    </div>
  );
}

function StoryContent({ story, muted, paused, videoRef }) {
  if (story.type === StatusType.TEXT) {
    // The outer container already has the bgColor. We just lay out the
    // text large + centered, matching the WA Web text status.
    return (
      <div
        className="flex h-full w-full items-center justify-center px-10 text-center"
        style={{ fontFamily: story.font ?? undefined }}
      >
        <p className="text-2xl font-medium leading-relaxed text-white">
          {story.content}
        </p>
      </div>
    );
  }
  if (story.type === StatusType.VIDEO) {
    return (
      <video
        ref={videoRef}
        src={story.mediaUrl}
        autoPlay={!paused}
        muted={muted}
        playsInline
        className="max-h-full max-w-full"
      />
    );
  }
  return (
    <img
      src={story.mediaUrl}
      alt={story.caption ?? ""}
      className="max-h-full max-w-full"
    />
  );
}
