// apps/studio/app/api/sim/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.SIM_BACKEND_URL || "http://localhost:4000";

export async function GET() {
  const res = await fetch(`${BASE}/api/sim/state`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const { action } = (await req.json()) as { action: "step" | "reset" };

  if (action === "step") {
    const res = await fetch(`${BASE}/api/sim/step`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }

  if (action === "reset") {
    const res = await fetch(`${BASE}/api/sim/reset`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
