"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  useClearPushSubscriptionMutation,
  useSavePushSubscriptionMutation,
} from "@/tanstack/users/mutations";
import { useAuth } from "@/hooks/use-auth";
import { COPY } from "@/config/constants";

const SW_PATH = "/sw.js";

// Manages the Web Push lifecycle:
//   1) registers the service worker on mount (if the browser supports it).
//   2) reports the current permission + subscription state to the caller.
//   3) exposes `subscribe()` / `unsubscribe()` for the Settings UI.
export function usePushSubscription() {
  const { isAuthenticated } = useAuth();
  const save = useSavePushSubscriptionMutation();
  const clear = useClearPushSubscriptionMutation();

  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscription, setSubscription] = useState(null);

  // Detect support + register the SW once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok || !isAuthenticated) return;
    setPermission(Notification.permission);

    navigator.serviceWorker
      .register(SW_PATH)
      .then(async (reg) => {
        const existing = await reg.pushManager.getSubscription();
        if (existing) setSubscription(existing);
      })
      .catch(() => {
        /* SW registration failures shouldn't block the rest of the app. */
      });
  }, [isAuthenticated]);

  const subscribe = useCallback(async () => {
    if (!supported) return false;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Web Push is not configured");
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error(COPY.PUSH_PERMISSION_BLOCKED);
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      setSubscription(sub);
      await save.mutateAsync(sub.toJSON());
      return true;
    } catch (err) {
      toast.error(err?.message ?? "Could not enable notifications");
      return false;
    }
  }, [supported, save]);

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch {
        /* ignore — server-side row will be cleared anyway. */
      }
    }
    setSubscription(null);
    await clear.mutateAsync().catch(() => {});
  }, [subscription, clear]);

  return {
    supported,
    permission,
    isSubscribed: !!subscription,
    isPending: save.isPending || clear.isPending,
    subscribe,
    unsubscribe,
  };
}

// Standard helper from the W3C Push API examples. Converts the public VAPID
// key (URL-safe base64) into the Uint8Array `applicationServerKey` expects.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
