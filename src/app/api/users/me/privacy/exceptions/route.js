import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setPrivacyException } from "@/lib/me-profile";

// PATCH /api/users/me/privacy/exceptions
// Body: { field: "lastSeen" | "profilePhoto" | "about" | "status" | "groupsPolicy",
//         excludedIds: string[] }
//
// Writes the per-field exclusion array on PrivacySettings.privacyExceptions
// and returns the updated row. The lib filters the ids to the caller's
// accepted-friend list so a forged payload can't exclude strangers.
export async function PATCH(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (typeof body?.field !== "string") {
    return NextResponse.json({ error: "field is required" }, { status: 400 });
  }
  try {
    const updated = await setPrivacyException({
      userId: user.id,
      field: body.field,
      excludedIds: body.excludedIds ?? [],
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err.status)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
