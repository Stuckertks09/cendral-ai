// apps/studio/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.SIM_BACKEND_URL || "http://localhost:4000";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${BASE}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
