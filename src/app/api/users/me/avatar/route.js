import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadMedia } from "@/lib/upload";
import { updateMe } from "@/lib/me-profile";
import { MessageType } from "@/models/enums";

export async function PUT(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const updated = await updateMe({
      userId: user.id,
      avatar: asset.mediaUrl,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const updated = await updateMe({ userId: user.id, avatar: null });
  return NextResponse.json(updated);
}
