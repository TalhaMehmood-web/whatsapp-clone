import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteMessage, editMessage } from "@/lib/messages";

export async function PATCH(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (typeof body?.content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  try {
    const updated = await editMessage({
      userId: user.id,
      messageId: id,
      content: body.content,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err.status) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(req, ctx) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  // Mode lives on the querystring so the existing fetch helpers don't
  // need a body on DELETE: ?mode=me | everyone (default) | purge.
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("mode");
  const mode = raw === "me" || raw === "purge" ? raw : "everyone";
  try {
    const updated = await deleteMessage({
      userId: user.id,
      messageId: id,
      mode,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err.status) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
