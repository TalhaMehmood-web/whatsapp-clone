import { NextResponse } from "next/server";
import { pruneExpiredStatuses } from "@/lib/status";

// Hourly cron — prunes Status rows whose 24h TTL has passed and asks
// Cloudinary to destroy the underlying photo/video so we don't burn
// storage quota on content that's no longer visible.
//
// ─── Auth ────────────────────────────────────────────────────────────
// Vercel attaches a Bearer token to every Cron Job request matching
// `process.env.CRON_SECRET`. We reject anything without it so this
// endpoint can't be invoked by random traffic to drain our Cloudinary
// account. Set CRON_SECRET in Vercel project env vars + .env.local.
//
// ─── Lifecycle ───────────────────────────────────────────────────────
// We process up to 100 rows per invocation (see pruneExpiredStatuses)
// to keep the route well under the Vercel function timeout. If there's
// a larger backlog (e.g. after a Cron outage), it drains across
// subsequent hourly runs without any retry logic on our side.
export const dynamic = "force-dynamic";

export async function GET(req) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;
  if (expected && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pruneExpiredStatuses();
  return NextResponse.json({ ok: true, ...result });
}
