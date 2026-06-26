"use client";

// Doodle background container for the message pane. The user's chat-prefs
// `wallpaperUrl` decides what we render:
//   - null     → default doodle pattern
//   - "#…"     → solid color
//   - "http…"  → uploaded image (Cloudinary)
import { useChatPrefsQuery } from "@/tanstack/users/queries";
import { cn } from "@/utils/cn";

// Stable selector at module scope so TanStack treats it as referentially
// equal across renders — otherwise the projection would re-run every
// time the component re-renders and we'd lose the equality bailout.
const selectWallpaper = (prefs) => prefs?.wallpaperUrl ?? null;

export function ChatWallpaper({ className, children }) {
  const { data: value } = useChatPrefsQuery({ select: selectWallpaper });

  if (value && /^https?:\/\//.test(value)) {
    // Uploaded image. `background-size: cover` matches WhatsApp's
    // behaviour — image fills the pane and crops as needed.
    return (
      <div
        className={cn("flex-1 overflow-hidden bg-wa-bg", className)}
        style={{
          backgroundImage: `url(${JSON.stringify(value)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {children}
      </div>
    );
  }

  if (value) {
    return (
      <div
        className={cn("flex-1 overflow-hidden", className)}
        style={{ backgroundColor: value }}
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
