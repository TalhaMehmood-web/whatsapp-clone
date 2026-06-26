"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatPrefsQuery } from "@/tanstack/users/queries";
import { useUpdateChatPrefsMutation } from "@/tanstack/users/mutations";
import { COPY } from "@/config/constants";
import { cn } from "@/utils/cn";

// 7 preset wallpaper swatches + a "reset" option. We persist the chosen
// solid color as a hex string in `wallpaperUrl`; null means default doodles.
const SWATCHES = [
  null,
  "#0b141a",
  "#1f2c33",
  "#1f3a3a",
  "#3b2c25",
  "#2c1a4d",
  "#4a2c2c",
  "#1f3f1f",
];

export function WallpaperSubpage() {
  const { data: prefs, isLoading } = useChatPrefsQuery();
  const update = useUpdateChatPrefsMutation();

  if (isLoading || !prefs) {
    return (
      <div className="flex justify-center py-8 text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <p className="px-2 pb-3 text-xs text-wa-text-muted">
        {COPY.CHAT_PREFS_WALLPAPER_DESC}
      </p>

      <div className="grid grid-cols-4 gap-3">
        {SWATCHES.map((color) => {
          const active = (prefs.wallpaperUrl ?? null) === color;
          return (
            <button
              key={color ?? "default"}
              type="button"
              onClick={() => update.mutate({ wallpaperUrl: color })}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                active ? "border-wa-green" : "border-transparent hover:border-wa-panel-3",
              )}
              style={{
                background:
                  color ??
                  "repeating-linear-gradient(45deg, var(--wa-panel-2), var(--wa-panel-2) 6px, var(--wa-panel) 6px, var(--wa-panel) 12px)",
              }}
              aria-label={color ?? COPY.WALLPAPER_DEFAULT}
              aria-pressed={active}
            />
          );
        })}
      </div>

      {prefs.wallpaperUrl && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 text-wa-text-muted hover:text-wa-text"
          onClick={() => update.mutate({ wallpaperUrl: null })}
        >
          {COPY.WALLPAPER_RESET}
        </Button>
      )}
    </div>
  );
}
