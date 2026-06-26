import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getEligibleContacts } from "@/lib/me-profile";

// GET /api/users/me/contacts/eligible
// Powers the Privacy "My contacts except…" picker — returns the caller's
// accepted-friend list as a slim {id, name, avatar, about} array sorted
// by name. Cached infinitely on the client; invalidated only when a
// friend request changes status (already handled by the friends socket
// listener).
export async function GET(req) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contacts = await getEligibleContacts(user.id);
  return NextResponse.json({ contacts });
}
