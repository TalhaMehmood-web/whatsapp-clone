"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Pause, Play } from "lucide-react";

import { cn } from "@/utils/cn";

// WhatsApp-style voice note bubble. Shows a play/pause button, a 28-bar
// waveform that fills as the audio plays, and a timer that swaps from
// total-duration to elapsed-time once playback starts.
//
// We don't decode the actual audio (decodeAudioData would block the
// main thread + cost CPU) — instead we synthesise a deterministic
// pseudo-waveform from the message id so the bars look stable and
// "shaped" without being misleading. Same trick Telegram Web uses;
// users perceive it as a progress indicator more than a real spectrum.
const BAR_COUNT = 28;
const SEEK_BAR_WIDTH = "100%";

export function VoiceNotePlayer({
  src,
  durationSec,
  className,
  // When the bubble is the user's own message we keep the play-button
  // tint subtle; incoming messages get the green disc to match
  // WhatsApp's outgoing-vs-incoming contrast.
  variant = "incoming",
  // Optional id used to deterministically seed the synthesised bars so
  // the same voice note always looks the same. Falls back to a random
  // seed if not provided.
  seed,
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [currentSec, setCurrentSec] = useState(0);
  const [loadedDuration, setLoadedDuration] = useState(null);

  // Best-effort: prefer the server-reported duration (set on upload),
  // fall back to whatever the audio element reports once it's loaded.
  const duration = durationSec ?? loadedDuration ?? 0;

  // Deterministic bars from the seed. Synthesised once per id so the
  // bubble's silhouette is stable across renders.
  const bars = useMemo(() => synthesiseBars(seed ?? src ?? "x"), [seed, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const onTime = () => {
      const d = audio.duration || duration || 1;
      setCurrentSec(audio.currentTime);
      setProgress(Math.min(1, audio.currentTime / d));
    };
    const onLoaded = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        setLoadedDuration(audio.duration);
      }
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentSec(0);
      audio.currentTime = 0;
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, [duration]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  };

  // Click anywhere on the waveform to scrub. Position is computed from
  // the bounding rect so it works under transforms.
  const onSeek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const target = Math.max(0, Math.min(1, pct)) * duration;
    a.currentTime = target;
    setCurrentSec(target);
    setProgress(target / duration);
  };

  return (
    <div
      className={cn(
        "flex w-64 items-center gap-2 rounded-lg px-2 py-1",
        className,
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full text-white transition-colors",
          variant === "incoming"
            ? "bg-wa-green hover:bg-wa-green/90"
            : "bg-wa-panel-3 hover:bg-wa-panel-3/70",
        )}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>

      <button
        type="button"
        onClick={onSeek}
        aria-label="Seek voice note"
        className="relative flex h-8 flex-1 items-center"
        style={{ width: SEEK_BAR_WIDTH }}
      >
        <span className="flex h-full w-full items-center gap-[2px]">
          {bars.map((h, i) => {
            const filled = (i + 1) / bars.length <= progress;
            return (
              <span
                key={i}
                className={cn(
                  "block w-[3px] rounded-sm transition-colors",
                  filled
                    ? "bg-wa-green"
                    : variant === "incoming"
                      ? "bg-wa-text-muted/50"
                      : "bg-wa-text-muted/70",
                )}
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            );
          })}
        </span>
      </button>

      <div className="flex shrink-0 flex-col items-end gap-0.5 text-[10px] tabular-nums leading-none text-wa-text-muted">
        <Mic className="size-3" />
        <span>{formatSec(playing || progress > 0 ? currentSec : duration)}</span>
      </div>
    </div>
  );
}

function formatSec(s) {
  const total = Math.round(s || 0);
  const m = Math.floor(total / 60).toString();
  const ss = (total % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

// Deterministic "spectrum" — a cheap hash on the seed produces a
// repeatable sequence of bar heights in the 0.25..1.0 range so very
// short notes still look filled, but every note has its own silhouette.
function synthesiseBars(seed) {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  const bars = [];
  for (let i = 0; i < BAR_COUNT; i += 1) {
    h ^= (h << 13) >>> 0;
    h ^= h >>> 17;
    h ^= (h << 5) >>> 0;
    const t = (h >>> 0) / 0xffffffff;
    // bias towards the middle of the bar so the silhouette has shape
    const shaped = 0.25 + 0.75 * Math.sin(Math.PI * (i / (BAR_COUNT - 1))) * t;
    bars.push(Math.max(0.2, Math.min(1, shaped)));
  }
  return bars;
}
