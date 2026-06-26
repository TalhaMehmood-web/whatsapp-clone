// Re-encodes an image File at a smaller resolution + lower JPEG quality
// so STANDARD-quality uploads use the user's bandwidth efficiently. HD
// uploads skip this helper entirely and ship the original bytes.
//
// We resize so the longest side is at most `maxSide` pixels, preserving
// the aspect ratio. If the image is already smaller, we still re-encode
// to JPEG q=0.8 — it's the q drop that delivers most of the savings on
// modern phone photos (they're usually 4–6 MB at native quality).
//
// Returns a new File with the original filename suffixed with `-sd.jpg`
// so the user sees a sensible name in the chat bubble. Falls back to the
// original file on any error (very old browser, OOM, etc.) so a single
// bad photo can't kill the upload flow.
const DEFAULT_MAX_SIDE = 1280;
const DEFAULT_QUALITY = 0.8;

export async function downscaleImage(
  file,
  { maxSide = DEFAULT_MAX_SIDE, quality = DEFAULT_QUALITY } = {},
) {
  if (!file || !file.type?.startsWith("image/")) return file;
  // GIFs would lose their animation if we ran them through a canvas; skip.
  if (file.type === "image/gif") return file;

  try {
    const bitmap = await loadBitmap(file);
    const { width, height } = bitmap;
    const longest = Math.max(width, height);
    const scale = longest > maxSide ? maxSide / longest : 1;
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(targetW, targetH)
        : Object.assign(document.createElement("canvas"), {
            width: targetW,
            height: targetH,
          });
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);

    const blob = await canvasToBlob(canvas, quality);
    if (!blob) return file;
    // If re-encoding made the file BIGGER (rare, but happens for already
    // small + lightly compressed PNGs), ship the original — saving the
    // user from a worse-of-both-worlds upload.
    if (blob.size >= file.size) return file;

    const cleanName = file.name?.replace(/\.[a-z0-9]+$/i, "") ?? "image";
    return new File([blob], `${cleanName}-sd.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  // Legacy fallback — bitmap-less browsers (pre-2020 Safari) load via Image.
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  if (canvas.convertToBlob) {
    return canvas.convertToBlob({ type: "image/jpeg", quality });
  }
  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
}
