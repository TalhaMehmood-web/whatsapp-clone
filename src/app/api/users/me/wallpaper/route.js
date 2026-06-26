import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadMedia } from "@/lib/upload";
import { updateChatPrefs } from "@/lib/me-profile";
import { MessageType } from "@/models/enums";

// Custom chat wallpaper upload. Accepts a multipart form with a single
// `file` image, ships it to Cloudinary, then writes the secure URL onto
// ChatPreferences.wallpaperUrl so every chat picks it up immediately.
//
// Returns the updated chat-prefs row so the client can patch its cache
// in one round-trip (matches the avatar-upload pattern).
export async function PUT(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  try {
    const asset = await uploadMedia({
      file,
      kind: MessageType.IMAGE,
      userId: user.id,
    });
    const updated = await updateChatPrefs({
      userId: user.id,
      wallpaperUrl: asset.mediaUrl,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err.message ?? "Upload failed" },
      { status: err.status ?? 500 },
    );
  }
}

// Clear the custom wallpaper — falls back to the default doodle pattern.
export async function DELETE(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const updated = await updateChatPrefs({
    userId: user.id,
    wallpaperUrl: null,
  });
  return NextResponse.json(updated);
}
