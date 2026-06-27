"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Reads `?msg={id}` from the URL when the chat detail mounts and:
//   1. Scrolls the matching message into view (id convention: `msg-{id}`,
//      set on every <MessageBubble>).
//   2. Adds a brief `data-deeplink="true"` flash so the user can spot
//      where they landed instead of being dumped somewhere random.
//   3. Strips the param from the URL after scrolling so a refresh
//      doesn't re-flash and a back-navigation lands clean.
//
// The bubble doesn't need a special render path — the CSS targets the
// `[data-deeplink="true"]` attribute via a rule in globals.css; we
// remove the attribute after 1.5s so the highlight is one-shot.
//
// Used by the global message-search results to jump straight to the
// matched message. Renders nothing.
const FLASH_MS = 1500;
const POLL_MS = 80;
const POLL_BUDGET_MS = 4000; // give the virtualizer up to 4s to mount the row

export function MessageDeepLinkScroller() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const handled = useRef(null);

  useEffect(() => {
    const msgId = params.get("msg");
    if (!msgId) return;
    if (handled.current === msgId) return;
    handled.current = msgId;

    const targetId = `msg-${msgId}`;
    const started = Date.now();

    // The chat is an infinite-scroll list — the message we want may
    // live on an unmounted page. Poll until the bubble exists or the
    // budget runs out. If it never shows up (out of cache, very old),
    // we just clean the URL and bail silently.
    const tryScroll = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.setAttribute("data-deeplink", "true");
        setTimeout(() => el.removeAttribute("data-deeplink"), FLASH_MS);
        // Strip ?msg= so a refresh doesn't re-flash. `pathname` only
        // (no query) gives us a clean URL.
        router.replace(pathname);
        return true;
      }
      return false;
    };

    if (tryScroll()) return;

    const interval = setInterval(() => {
      if (tryScroll() || Date.now() - started > POLL_BUDGET_MS) {
        clearInterval(interval);
        // Clean the URL even if we never found the bubble — the
        // intent was consumed.
        router.replace(pathname);
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [params, pathname, router]);

  return null;
}
