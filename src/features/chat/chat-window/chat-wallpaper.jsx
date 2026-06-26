"use client";

// Doodle background container for the message pane. When the user has
// picked a solid color in Settings → Chats → Wallpaper, we render that
// flat color instead of the doodle pattern.
import { useChatPrefsQuery } from "@/tanstack/users/queries";
import { cn } from "@/utils/cn";

export function ChatWallpaper({ className, children }) {
  const { data: prefs } = useChatPrefsQuery();
  const solid = prefs?.wallpaperUrl ?? null;

  if (solid) {
    return (
      <div
        className={cn("flex-1 overflow-hidden", className)}
        style={{ backgroundColor: solid }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn("wa-doodle flex-1 overflow-hidden", className)}>
      {children}
    </div>
  );
}
