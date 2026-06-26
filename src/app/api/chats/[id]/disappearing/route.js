import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setDisappearing } from "@/lib/chats";

export async function PUT(req, ctx) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    await setDisappearing({
      userId: user.id,
      chatId: id,
      seconds: body?.seconds ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
