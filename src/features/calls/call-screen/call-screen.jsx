"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEndCallMutation } from "@/tanstack/calls/mutations";
import { useAuth } from "@/hooks/use-auth";
import { useWebRtcCall } from "@/hooks/use-webrtc-call";
import { CallStatus, CallType } from "@/models/enums";
import { COPY, ROUTES } from "@/config/constants";

const TERMINAL = new Set([
  CallStatus.DECLINED,
  CallStatus.ENDED,
  CallStatus.MISSED,
]);

// Visual shell for an active call. Reflects the canonical server-side
// CallStatus and the live peer-connection state from useWebRtcCall.
//
// Caller flow: RINGING → ("Calling…") → ANSWERED → ("Connecting…")
//   → PC.connected → ("00:01" duration). Terminal status routes us out.
// Callee flow: starts at ANSWERED on mount (the accept mutation already
//   flipped it) → ("Connecting…") → PC.connected → duration.
export function CallScreen({ call }) {
  const router = useRouter();
  const { user } = useAuth();
  const end = useEndCallMutation();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [seconds, setSeconds] = useState(0);

  const peers = call.participants.filter((p) => p.id !== user?.id);
  const peer = peers[0] ?? { name: "Unknown" };
  const role = call.callerId === user?.id ? "caller" : "callee";

  const {
    attachLocal,
    attachRemote,
    audioOn,
    videoOn,
    status: pcStatus,
    toggleAudio,
    toggleVideo,
    hangup,
  } = useWebRtcCall({
    callId: call.id,
    peerId: peer?.id,
    type: call.type,
    role,
    callStatus: call.status,
  });

  useEffect(() => {
    attachLocal(localVideoRef.current);
    attachRemote(remoteVideoRef.current);
  }, [attachLocal, attachRemote]);

  // Duration only ticks once the peer connection is up.
  useEffect(() => {
    if (pcStatus !== "connected") return undefined;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [pcStatus]);

  // If the *peer* declines / ends / times out, the server flips status to
  // a terminal value and broadcasts CALL_UPDATE. Route us out so the call
  // screen disappears for both sides.
  useEffect(() => {
    if (TERMINAL.has(call.status)) {
      hangup();
      const t = setTimeout(() => router.replace(ROUTES.CALLS), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [call.status, hangup, router]);

  const onEnd = () => {
    hangup();
    end.mutate(call.id, {
      onSuccess: () => router.replace(ROUTES.CALLS),
      onError: (err) => toast.error(err.response?.data?.error ?? "Failed"),
    });
  };

  const isVideo = call.type === CallType.VIDEO;
  const presence = labelFor({
    callStatus: call.status,
    pcStatus,
    role,
    seconds,
  });

  return (
    <div className="relative flex h-full flex-col items-center justify-between bg-black px-6 py-10 text-white">
      <header className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={peer.avatar ?? undefined} alt={peer.name} />
            <AvatarFallback className="bg-wa-panel-3 text-xs">
              {(peer.name ?? "??").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{peer.name}</p>
            <p className="text-xs text-white/70">
              {isVideo ? COPY.CALL_VIDEO : COPY.CALL_VOICE}
            </p>
          </div>
        </div>
        <p className="font-mono text-sm text-white/70">{presence}</p>
      </header>

      <div className="relative flex flex-1 items-center justify-center self-stretch">
        {isVideo ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="max-h-full max-w-full rounded-lg bg-wa-panel-2"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-3 right-3 h-32 w-24 rounded-md bg-wa-panel-2 object-cover"
            />
          </>
        ) : (
          <>
            <audio ref={remoteVideoRef} autoPlay />
            <Avatar className="size-40">
              <AvatarImage src={peer.avatar ?? undefined} alt={peer.name} />
              <AvatarFallback className="bg-wa-panel-3 text-3xl">
                {(peer.name ?? "??").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </>
        )}
      </div>

      <footer className="flex items-center gap-3">
        <Button
          size="icon-lg"
          variant="ghost"
          aria-label={audioOn ? COPY.CALL_MUTE : COPY.CALL_UNMUTE}
          onClick={toggleAudio}
          className="rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          {audioOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </Button>
        {isVideo && (
          <Button
            size="icon-lg"
            variant="ghost"
            aria-label={COPY.CALL_VIDEO_TOGGLE}
            onClick={toggleVideo}
            className="rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            {videoOn ? (
              <Video className="size-5" />
            ) : (
              <VideoOff className="size-5" />
            )}
          </Button>
        )}
        <Button
          size="icon-lg"
          aria-label={COPY.CALL_END}
          onClick={onEnd}
          loading={end.isPending}
          className="rounded-full bg-wa-danger text-white hover:bg-wa-danger/90"
        >
          <PhoneOff className="size-5" />
        </Button>
      </footer>
    </div>
  );
}

function labelFor({ callStatus, pcStatus, role, seconds }) {
  if (callStatus === CallStatus.RINGING) {
    return role === "caller" ? "Ringing…" : "Incoming…";
  }
  if (callStatus === CallStatus.DECLINED) return "Declined";
  if (callStatus === CallStatus.MISSED) return "No answer";
  if (callStatus === CallStatus.ENDED) return "Call ended";
  if (pcStatus === "connected") return formatDuration(seconds);
  return "Connecting…";
}

function formatDuration(s) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}
