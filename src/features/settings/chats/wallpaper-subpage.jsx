"use client";

import { useRef } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatPrefsQuery } from "@/tanstack/users/queries";
import {
  useDeleteWallpaperMutation,
  useUpdateChatPrefsMutation,
  useUploadWallpaperMutation,
} from "@/tanstack/users/mutations";
import { COPY, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/config/constants";
import { cn } from "@/utils/cn";

// 7 preset wallpaper swatches + a "default" slot + a custom-image upload
// tab. We store the chosen value in `chatPrefs.wallpaperUrl`:
//   - null         → default doodle pattern
//   - "#RRGGBB"    → solid color
//   - "https://…"  → uploaded Cloudinary image
//
// ChatWallpaper decides which renderer to use based on the prefix.
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
  const fileRef = useRef(null);
  const { data: prefs, isLoading } = useChatPrefsQuery();
  const update = useUpdateChatPrefsMutation();
  const upload = useUploadWallpaperMutation();
  const clear = useDeleteWallpaperMutation();

  if (isLoading || !prefs) {
    return (
      <div className="flex justify-center py-8 text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const currentValue = prefs.wallpaperUrl ?? null;
  const isCustom =
    typeof currentValue === "string" && currentValue.startsWith("http");

  const onPickFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`File too large. Max ${MAX_UPLOAD_LABEL}.`);
      return;
    }
    upload.mutate(file, {
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Upload failed"),
    });
  };

  return (
    <div className="px-4 py-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPickFile}
      />
      <p className="px-2 pb-3 text-xs text-wa-text-muted">
        {COPY.CHAT_PREFS_WALLPAPER_DESC}
      </p>

      <Tabs defaultValue={isCustom ? "custom" : "solid"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-transparent">
          <TabsTrigger value="solid">{COPY.WALLPAPER_TAB_SOLID}</TabsTrigger>
          <TabsTrigger value="custom">{COPY.WALLPAPER_TAB_CUSTOM}</TabsTrigger>
        </TabsList>

        <TabsContent value="solid" className="mt-3">
          <div className="grid grid-cols-4 gap-3">
            {SWATCHES.map((color) => {
              const active = !isCustom && currentValue === color;
              return (
                <button
                  key={color ?? "default"}
                  type="button"
                  onClick={() => update.mutate({ wallpaperUrl: color })}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                    active
                      ? "border-wa-green"
                      : "border-transparent hover:border-wa-panel-3",
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
        </TabsContent>

        <TabsContent value="custom" className="mt-3 space-y-3">
          {isCustom ? (
            <div className="overflow-hidden rounded-lg border-2 border-wa-green">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentValue}
                alt={COPY.WALLPAPER_CUSTOM_LABEL}
                className="block aspect-video w-full object-cover"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
              className="flex aspect-video w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-wa-border bg-wa-panel-2/40 text-sm text-wa-text-muted transition-colors hover:border-wa-green hover:bg-wa-panel-2"
            >
              {upload.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="size-5" />
                  {COPY.WALLPAPER_PICK_FILE}
                </>
              )}
            </button>
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
            >
              <ImagePlus className="mr-2 size-4" />
              {isCustom ? COPY.WALLPAPER_REPLACE : COPY.WALLPAPER_PICK_FILE}
            </Button>
            {isCustom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  clear.mutate(undefined, {
                    onError: (err) =>
                      toast.error(
                        err.response?.data?.error ?? "Failed to clear",
                      ),
                  })
                }
                disabled={clear.isPending}
                className="text-wa-text-muted hover:text-wa-text"
              >
                <Trash2 className="mr-2 size-4" />
                {COPY.WALLPAPER_RESET}
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {!isCustom && currentValue && (
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
