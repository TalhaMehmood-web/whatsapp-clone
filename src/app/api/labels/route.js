import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createLabel, listLabels } from "@/lib/labels";

export async function GET(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const labels = await listLabels(user.id);
  return NextResponse.json(labels);
}

export async function POST(req) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  try {
    const label = await createLabel({
      userId: user.id,
      name: body?.name,
      color: body?.color,
    });
    return NextResponse.json(label, { status: 201 });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
