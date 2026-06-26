import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { triggerToUser } from "@/lib/realtime/server";
import { SOCKET_EVENT } from "@/config/constants";

// WebRTC signaling relay. The peers exchange SDP offers/answers and ICE
// candidates by POSTing them here; the server forwards the payload to
// the destination user's private channel as a CALL_SIGNAL event.
//
// History: this used to be a Socket.io client→server emit. After the
// Pusher migration there's no client-emit path, so signaling goes
// through an API. Latency is ~30ms higher per message (negligible for
// SDP/ICE which only fires a handful of times per call), and we get
// server-side identity for free (`fromUserId` is the auth'd user, not
// whatever the client claims).
export async function POST(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const toUserId = body?.toUserId;
  if (typeof toUserId !== "string" || !toUserId) {
    return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });
  }

  // Forward the whole payload, stamping the authoritative `fromUserId`
  // so the receiver can trust the origin.
  await triggerToUser(toUserId, SOCKET_EVENT.CALL_SIGNAL, {
    ...body,
    fromUserId: user.id,
  });
  return NextResponse.json({ ok: true });
}
