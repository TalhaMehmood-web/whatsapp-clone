"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocketStore } from "@/stores/socket-store";
import { SOCKET_EVENT } from "@/config/constants";
import { CallStatus, CallType } from "@/models/enums";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

// 1:1 WebRTC negotiation glued onto our existing `call:signal` relay.
//
//   - Caller waits until the call's status transitions to ANSWERED (the
//     callee tapped Accept) before sending an SDP offer. This matches
//     WhatsApp: the dial tone keeps going until the peer answers.
//   - Callee listens for the offer and answers immediately after.
//   - Either side calling `hangup()` tears down the PC + tracks. Status
//     transitions to "ended" so the screen can route away.
//
// Returns: { attachLocal, attachRemote, toggleAudio, toggleVideo, hangup,
//            audioOn, videoOn, status: "idle"|"connecting"|"connected"|"ended" }
export function useWebRtcCall({ callId, peerId, type, role, callStatus }) {
  const socket = useSocketStore((s) => s.socket);
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const localEl = useRef(null);
  const remoteEl = useRef(null);
  const pendingIce = useRef([]);
  const offerSent = useRef(false);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(type === CallType.VIDEO);
  const [status, setStatus] = useState("idle");

  const wantsVideo = type === CallType.VIDEO;

  const send = useCallback(
    (payload) => {
      if (!socket || !peerId) return;
      socket.emit(SOCKET_EVENT.CALL_SIGNAL, {
        ...payload,
        callId,
        toUserId: peerId,
      });
    },
    [socket, peerId, callId],
  );

  // Build the peer connection + grab local media once we know the role.
  useEffect(() => {
    if (!socket || !peerId) return undefined;
    let cancelled = false;
    setStatus("connecting");

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) send({ kind: "ice", candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      remoteRef.current = stream;
      if (remoteEl.current) remoteEl.current.srcObject = stream;
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setStatus("connected");
      else if (s === "failed" || s === "disconnected") setStatus("ended");
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: wantsVideo,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localRef.current = stream;
        if (localEl.current) localEl.current.srcObject = stream;
        for (const t of stream.getTracks()) pc.addTrack(t, stream);
      } catch {
        setStatus("ended");
      }
    })();

    const onSignal = async (msg) => {
      if (!msg || msg.callId !== callId) return;
      try {
        if (msg.kind === "offer" && role === "callee") {
          await pc.setRemoteDescription(msg.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ kind: "answer", sdp: answer });
          for (const c of pendingIce.current) await pc.addIceCandidate(c);
          pendingIce.current = [];
        } else if (msg.kind === "answer" && role === "caller") {
          await pc.setRemoteDescription(msg.sdp);
          for (const c of pendingIce.current) await pc.addIceCandidate(c);
          pendingIce.current = [];
        } else if (msg.kind === "ice") {
          if (pc.remoteDescription) await pc.addIceCandidate(msg.candidate);
          else pendingIce.current.push(msg.candidate);
        }
      } catch {
        /* lossy negotiation — wait for the next signal */
      }
    };

    socket.on(SOCKET_EVENT.CALL_SIGNAL, onSignal);

    return () => {
      cancelled = true;
      socket.off(SOCKET_EVENT.CALL_SIGNAL, onSignal);
      pc.getSenders().forEach((s) => s.track && s.track.stop());
      pc.close();
      pcRef.current = null;
      remoteRef.current = null;
      const local = localRef.current;
      if (local) local.getTracks().forEach((t) => t.stop());
      localRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, peerId, callId, role]);

  // Caller-only: once the call flips to ANSWERED (the callee accepted),
  // create and send the SDP offer. Until then the screen stays on
  // "Ringing…" and no media is negotiated.
  useEffect(() => {
    if (role !== "caller") return;
    if (offerSent.current) return;
    if (callStatus !== CallStatus.ANSWERED) return;
    const pc = pcRef.current;
    if (!pc) return;
    (async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send({ kind: "offer", sdp: offer });
        offerSent.current = true;
      } catch {
        setStatus("ended");
      }
    })();
  }, [role, callStatus, send]);

  const attachLocal = useCallback((el) => {
    localEl.current = el;
    if (el && localRef.current) el.srcObject = localRef.current;
  }, []);
  const attachRemote = useCallback((el) => {
    remoteEl.current = el;
    if (el && remoteRef.current) el.srcObject = remoteRef.current;
  }, []);

  const toggleAudio = useCallback(() => {
    const stream = localRef.current;
    if (!stream) return;
    const next = !audioOn;
    stream.getAudioTracks().forEach((t) => (t.enabled = next));
    setAudioOn(next);
  }, [audioOn]);

  const toggleVideo = useCallback(() => {
    const stream = localRef.current;
    if (!stream) return;
    const next = !videoOn;
    stream.getVideoTracks().forEach((t) => (t.enabled = next));
    setVideoOn(next);
  }, [videoOn]);

  const hangup = useCallback(() => {
    pcRef.current?.close();
    const stream = localRef.current;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStatus("ended");
  }, []);

  return {
    attachLocal,
    attachRemote,
    audioOn,
    videoOn,
    status,
    toggleAudio,
    toggleVideo,
    hangup,
  };
}
