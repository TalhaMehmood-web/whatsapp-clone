// Helpers for `generateMetadata` on the public landing pages
// (`/u/{handle}`, `/c/{handle}`, `/ch/{handle}`). These render Open
// Graph + Twitter card tags so links shared on social media show a
// rich preview instead of a bare URL.
//
// Two utilities:
//   absoluteUrl(path) — joins a relative path onto the deployment's
//                       public origin, preferring NEXT_PUBLIC_URL,
//                       falling back to the request's forwarded host.
//   buildOg(input)    — assembles the openGraph + twitter card blocks
//                       in the shape Next.js expects from
//                       generateMetadata. Pure: no I/O.
//
// We do NOT generate an OG image on the fly. Cloudinary already serves
// the user's avatar / community photo / channel photo at a CDN URL,
// and OG crawlers cache that URL — so we pass it straight through.
// When no image is set the metadata omits the field; the crawler
// falls back to its default rendering.

import { headers } from "next/headers";

export async function absoluteUrl(path = "/") {
  if (process.env.NEXT_PUBLIC_URL) {
    return new URL(path, process.env.NEXT_PUBLIC_URL).toString();
  }
  // Last-resort fallback for deploys without the env set — Vercel
  // forwards the actual host so the URL is still correct.
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}${path}`;
  } catch {
    // headers() is only available in dynamic server components — if
    // it throws (e.g. called at build time), we just return the path
    // unchanged. Most OG crawlers still resolve it relative to the
    // page URL.
  }
  return path;
}

export function buildOg({
  title,
  description,
  url,
  image,
  imageAlt,
  type = "profile",
  siteName = "WhatsApp",
}) {
  const safeDescription = description?.slice(0, 200) ?? undefined;
  const images = image
    ? [{ url: image, alt: imageAlt ?? title, width: 400, height: 400 }]
    : undefined;
  return {
    title,
    description: safeDescription,
    openGraph: {
      type,
      url,
      siteName,
      title,
      description: safeDescription,
      images,
    },
    twitter: {
      card: "summary",
      title,
      description: safeDescription,
      images: image ? [image] : undefined,
    },
    alternates: { canonical: url },
  };
}
