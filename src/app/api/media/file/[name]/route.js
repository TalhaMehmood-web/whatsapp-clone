import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Streams a remote (Cloudinary) asset through our server with corrected
// Content-Type + Content-Disposition headers so the browser renders the
// file inline instead of auto-downloading it as `octet-stream`.
//
// The route uses a dynamic `[name]` segment instead of a query param so
// the URL ends in the real filename (e.g. `/api/media/file/report.pdf`).
// Chrome falls back to the last URL segment when picking the download
// filename, so this guarantees the Save-As dialog shows the right name
// even if our explicit Content-Disposition is ever stripped by a proxy.
//
// Auth: none. Iframes/objects can't send Bearer headers, and the upstream
// Cloudinary URLs are already public-reachable for anyone with the link.
export async function GET(req, ctx) {
  const { name } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");
  const disposition = searchParams.get("dl") === "1" ? "attachment" : "inline";

  if (!target || !/^https:\/\/res\.cloudinary\.com\//.test(target)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const upstream = await fetch(target);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: upstream.status || 502 },
    );
  }

  // Cloudinary serves raw assets as `application/octet-stream`, which
  // makes browsers refuse to render PDFs inline. Override by extension
  // so PDFs/images/text get the right MIME and render correctly.
  const cleanName = decodeURIComponent(name);
  const ext = (cleanName.split(".").pop() ?? "").toLowerCase();
  const upstreamCT = upstream.headers.get("content-type") ?? "";
  const contentType =
    upstreamCT && !upstreamCT.includes("octet-stream")
      ? upstreamCT
      : (MIME_BY_EXT[ext] ?? "application/octet-stream");

  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": `${disposition}; filename="${sanitize(cleanName)}"`,
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new Response(upstream.body, { status: 200, headers });
}

const MIME_BY_EXT = {
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json",
  xml: "application/xml",
  html: "text/html; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  rar: "application/vnd.rar",
};

function sanitize(name) {
  return name.replace(/[\r\n"]/g, "");
}
