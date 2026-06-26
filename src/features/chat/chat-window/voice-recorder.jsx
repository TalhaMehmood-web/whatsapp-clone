"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, Pause, Play, SendHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  useSendMessageMutation,
  useUploadMediaMutation,
} from "@/tanstack/messages/mutations";
import { useAuthStore } from "@/stores/auth-store";
import { queryKeys } from "@/config/query-keys";
import { MessageType, ReceiptStatus } from "@/models/enums";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/config/constants";

// Three-state voice recorder, matching WhatsApp Web's flow:
//   idle      → mic button.
//   recording → red dot + timer + delete / pause / send. Send finishes
//               the recording without going through the preview.
//   preview   → playback row with play / pause + delete / send. Reached
//               by tapping the pause button while recording.
//
// Send always inserts an optimistic VOICE_NOTE bubble first (with the
// PENDING tick) and only then uploads + creates the server message.
export function VoiceRecorder({ chatId }) {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const upload = useUploadMediaMutation();
  const send = useSendMessageMutation(chatId);

  const [phase, setPhase] = useState("idle"); // idle | recording | preview
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const previewBlobRef = useRef(null);
  const previewUrlRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => () => cleanup(), []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    previewBlobRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
  };

  const start = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      toast.error("Microphone not available");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.start();
      mediaRecorderRef.current = rec;
      setPhase("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecorder = () =>
    new Promise((resolve) => {
      const rec = mediaRecorderRef.current;
      if (!rec || rec.state === "inactive") return resolve(null);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        resolve(blob);
      };
      rec.stop();
    });

  const cancel = () => {
    cleanup();
    setPhase("idle");
    setElapsed(0);
    setIsPlaying(false);
  };

  const pauseToPreview = async () => {
    const blob = await stopRecorder();
    if (!blob) return;
    previewBlobRef.current = blob;
    previewUrlRef.current = URL.createObjectURL(blob);
    audioRef.current = new Audio(previewUrlRef.current);
    audioRef.current.onended = () => setIsPlaying(false);
    setPhase("preview");
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.play();
      setIsPlaying(true);
    }
  };

  const finish = async () => {
    let blob = previewBlobRef.current;
    if (!blob) blob = await stopRecorder();
    if (!blob) return;
    const duration = elapsed;
    const file = new File([blob], `voice-${Date.now()}.webm`, {
      type: "audio/webm",
    });
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`Voice note too large. Max ${MAX_UPLOAD_LABEL}.`);
      cleanup();
      setPhase("idle");
      setElapsed(0);
      setIsPlaying(false);
      return;
    }
    cleanup();
    setPhase("idle");
    setElapsed(0);
    setIsPlaying(false);

    const tempId = `temp-${Date.now()}`;
    const key = queryKeys.messages.list(chatId);

    qc.setQueryData(key, (old) => {
      const optimistic = {
        id: tempId,
        chatId,
        senderId: me?.id,
        content: null,
        type: MessageType.VOICE_NOTE,
        mediaUrl: null,
        mediaMime: file.type,
        mediaSizeBytes: file.size,
        mediaDuration: duration,
        fileName: file.name,
        caption: null,
        replyToId: null,
        forwardedFrom: null,
        forwardCount: 0,
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: me
          ? { id: me.id, name: me.name, avatar: me.avatar ?? null }
          : null,
        receipts: [{ userId: me?.id, status: ReceiptStatus.READ }],
        reactions: [],
        starredBy: [],
        replyTo: null,
        __optimistic: true,
      };
      if (!old) {
        return {
          pageParams: [null],
          pages: [{ messages: [optimistic], nextCursor: null }],
        };
      }
      return {
        ...old,
        pages: old.pages.map((p, i) =>
          i === 0 ? { ...p, messages: [...p.messages, optimistic] } : p,
        ),
      };
    });

    try {
      const asset = await upload.mutateAsync({
        file,
        kind: MessageType.VOICE_NOTE,
      });
      await send.mutateAsync({ ...asset, type: MessageType.VOICE_NOTE });
    } catch (err) {
      qc.setQueryData(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            messages: p.messages.filter((m) => m.id !== tempId),
          })),
        };
      });
      toast.error(err.response?.data?.error ?? "Upload failed");
    }
  };

  if (phase === "idle") {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Voice"
        onClick={start}
        className="text-wa-text-muted hover:text-wa-text"
      >
        <Mic className="size-5" />
      </Button>
    );
  }

  if (phase === "recording") {
    return (
      <div className="flex flex-1 items-center gap-2 rounded-full bg-wa-panel-2 px-3 py-1">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Cancel"
          onClick={cancel}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <Trash2 className="size-4" />
        </Button>
        <span className="size-2 animate-pulse rounded-full bg-wa-danger" />
        <span className="text-xs tabular-nums text-wa-text">
          {formatElapsed(elapsed)}
        </span>
        <div className="flex-1" />
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Pause"
          onClick={pauseToPreview}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <Pause className="size-4" />
        </Button>
        <Button
          size="icon"
          aria-label="Send voice note"
          onClick={finish}
          className="bg-wa-green text-white hover:bg-wa-green/90"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    );
  }

  // preview phase
  return (
    <div className="flex flex-1 items-center gap-2 rounded-full bg-wa-panel-2 px-3 py-1">
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Cancel"
        onClick={cancel}
        className="text-wa-text-muted hover:text-wa-text"
      >
        <Trash2 className="size-4" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={isPlaying ? "Pause" : "Play"}
        onClick={togglePlay}
        className="text-wa-text-muted hover:text-wa-text"
      >
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
      </Button>
      <span className="text-xs tabular-nums text-wa-text">
        {formatElapsed(elapsed)}
      </span>
      <div className="flex-1" />
      <Button
        size="icon"
        aria-label="Send voice note"
        onClick={finish}
        className="bg-wa-green text-white hover:bg-wa-green/90"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </div>
  );
}

function formatElapsed(s) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}
