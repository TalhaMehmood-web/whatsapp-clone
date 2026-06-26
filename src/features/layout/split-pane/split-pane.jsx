"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

// Two-column shell that sits next to the nav rail.
//
// - `list` is the left column (chat list, settings menu, etc.).
// - `children` is the detail column (chat window, settings page, etc.).
//
// On desktop (md+) both panes render side-by-side. On mobile the URL
// decides which is visible:
//
//   /chat            → list  (no chat selected, so we want the picker)
//   /chat/[id]       → detail (the chat window covers the whole screen)
//   /settings        → list
//   /settings/whatever → detail
//
// We approximate "is a detail open" by counting URL segments beyond the
// section root — anything deeper is treated as detail mode.
export function SplitPane({ list, children, listClassName, detailClassName }) {
  const pathname = usePathname() ?? "";
  const detailMode = isDetailRoute(pathname);

  return (
    <div className="flex h-full min-h-0 w-full flex-1">
      <aside
        className={cn(
          "h-full w-full shrink-0 flex-col border-r border-wa-border bg-wa-panel md:flex md:w-md",
          detailMode ? "hidden md:flex" : "flex",
          listClassName,
        )}
      >
        {list}
      </aside>
      <main
        className={cn(
          "h-full min-w-0 flex-1 flex-col bg-wa-bg md:flex",
          detailMode ? "flex" : "hidden md:flex",
          detailClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}

function isDetailRoute(pathname) {
  // Strip a leading slash and split into segments.
  const parts = pathname.replace(/^\//, "").split("/").filter(Boolean);
  // `/chat` → ["chat"] (list); `/chat/abc` → ["chat", "abc"] (detail).
  // `/settings` → list; `/settings/profile` → detail. Same idea everywhere.
  return parts.length >= 2;
}
