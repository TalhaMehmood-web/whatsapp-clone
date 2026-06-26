// Cloudinary serves raw assets (PDFs, Office docs, archives) with
// `Content-Type: application/octet-stream` + `Content-Disposition:
// attachment` by default, which makes browsers auto-download them and
// refuse to render PDFs inline. The `fl_attachment` delivery flag only
// works for image/video resource types — it's silently ignored on raw
// URLs.
//
// So we route raw assets through `/api/media/file/<name>` which re-streams
// the bytes with the correct Content-Type (by extension) and a
// Content-Disposition we control. The filename lives in the URL path so
// the Save-As dialog gets the right name even if a downstream proxy
// strips our Content-Disposition header.

const PROXY = "/api/media/file";

export function inlineCloudinaryUrl(url, fileName) {
  if (!url) return url;
  if (!url.includes("res.cloudinary.com")) return url;
  const name = pickName(url, fileName);
  return `${PROXY}/${encodeURIComponent(name)}?url=${encodeURIComponent(url)}`;
}

export function downloadCloudinaryUrl(url, fileName) {
  if (!url) return url;
  if (!url.includes("res.cloudinary.com")) return url;
  const name = pickName(url, fileName);
  return `${PROXY}/${encodeURIComponent(name)}?url=${encodeURIComponent(url)}&dl=1`;
}

// Prefer the original filename the sender uploaded; fall back to the last
// segment of the Cloudinary URL, which already has the extension on it.
function pickName(url, fileName) {
  if (fileName) return fileName;
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last || "file";
  } catch {
    return "file";
  }
}
