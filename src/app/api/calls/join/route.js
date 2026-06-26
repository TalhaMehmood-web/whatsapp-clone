import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { joinCallLink } from "@/lib/calls";

// POST /api/calls/join
//   { callId, type, participantIds }  // type + participants are only
// honoured when the call doesn't exist yet (first joiner creates it).
//
// Returns the call row + participant list so the caller can route into
// /calls/<id>.
export async function POST(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body?.callId) {
    return NextResponse.json({ error: "callId is required" }, { status: 400 });
  }
  try {
    const call = await joinCallLink({
      joinerId: user.id,
      callId: body.callId,
      participantIds: body.participantIds ?? [],
      type: body.type,
    });
    return NextResponse.json(call);
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
