import { v2 as cloudinary } from "cloudinary";
import { MessageType } from "@/models/enums";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/config/constants";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Uploads a Web File / Blob to Cloudinary using the v2 SDK's stream API.
// Returns the normalised asset shape we attach to a Message.
export async function uploadMedia({ file, kind, userId }) {
  if (!file) throw new Error("No file provided");
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary is not configured");
  }
  if (typeof file.size === "number" && file.size > MAX_UPLOAD_BYTES) {
    const err = new Error(`File too large. Max ${MAX_UPLOAD_LABEL}.`);
    err.status = 413;
    throw err;
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const resourceType = cloudinaryResourceType(kind);

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `whatsapp/${userId}`,
        resource_type: resourceType,
        // Preserve the original filename + extension on the public_id so
        // raw assets (PDFs, Office docs) end up with a URL that ends in
        // `.pdf` / `.docx` etc. Without this, Cloudinary strips the
        // extension and browsers (+ the Google docs viewer) refuse to
        // render the file.
        use_filename: true,
        unique_filename: true,
      },
      (err, res) => (err ? reject(err) : resolve(res)),
    );
    stream.end(buffer);
  });

  return {
    mediaUrl: result.secure_url,
    mediaMime: file.type,
    mediaThumbUrl:
      kind === MessageType.VIDEO
        ? result.secure_url.replace(/\.[a-z0-9]+$/, ".jpg")
        : kind === MessageType.IMAGE
          ? result.secure_url
          : null,
    mediaSizeBytes: result.bytes,
    mediaDuration: result.duration ? Math.round(result.duration) : null,
    fileName: file.name ?? null,
    mediaPublicId: result.public_id,
    mediaResource: resourceType,
  };
}

// Best-effort destroy. We never want to block deleteMessage on a CDN
// failure, so we swallow errors and just log them.
export async function destroyMedia({ publicId, resourceType = "image" }) {
  if (!publicId) return;
  if (!process.env.CLOUDINARY_CLOUD_NAME) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (err) {
    console.warn("cloudinary destroy failed", { publicId, err });
  }
}

// Maps our MessageType enum onto Cloudinary's resource_type.
function cloudinaryResourceType(kind) {
  if (kind === MessageType.IMAGE) return "image";
  if (kind === MessageType.VIDEO) return "video";
  if (kind === MessageType.VOICE_NOTE || kind === MessageType.AUDIO)
    return "video"; // Cloudinary stores audio as "video"
  return "raw";
}
