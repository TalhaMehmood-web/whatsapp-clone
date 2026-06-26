import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadMedia } from "@/lib/upload";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/config/constants";

export const maxDuration = 60;

export async function POST(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const kind = form.get("kind");
  if (!file || !kind) {
    return NextResponse.json({ error: "Missing file or kind" }, { status: 400 });
  }
  if (typeof file.size === "number" && file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max ${MAX_UPLOAD_LABEL}.` },
      { status: 413 },
    );
  }

  try {
    const asset = await uploadMedia({ file, kind, userId: user.id });
    return NextResponse.json(asset);
  } catch (err) {
    return NextResponse.json(
      { error: err.message ?? "Upload failed" },
      { status: err.status ?? 500 },
    );
  }
}
