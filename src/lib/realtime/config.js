// Picks which realtime adapter is in use. Server-side reads
// `REALTIME_PROVIDER`; client-side reads `NEXT_PUBLIC_REALTIME_PROVIDER`
// (Next.js exposes only NEXT_PUBLIC_* vars to the browser bundle).
//
// Adding a new provider:
//   1. Drop an adapter under `adapters/<name>-server.js` and
//      `adapters/<name>-client.js`.
//   2. Add a case in `lib/realtime/server.js` + `lib/realtime/client.js`
//      that imports it.
//   3. Flip the env var. No feature code changes.

const SUPPORTED = ["pusher"];
const DEFAULT_PROVIDER = "pusher";

export function getServerProvider() {
  const raw = process.env.REALTIME_PROVIDER?.trim().toLowerCase();
  if (!raw) return DEFAULT_PROVIDER;
  if (!SUPPORTED.includes(raw)) {
    throw new Error(
      `REALTIME_PROVIDER=${raw} is not supported. Allowed: ${SUPPORTED.join(", ")}`,
    );
  }
  return raw;
}

export function getClientProvider() {
  const raw = process.env.NEXT_PUBLIC_REALTIME_PROVIDER?.trim().toLowerCase();
  if (!raw) return DEFAULT_PROVIDER;
  if (!SUPPORTED.includes(raw)) {
    // Don't throw on the client — fall back to default so a misconfigured
    // env var on Vercel doesn't crash every page load.
    return DEFAULT_PROVIDER;
  }
  return raw;
}
