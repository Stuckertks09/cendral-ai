// apps/studio/app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.SIM_BACKEND_URL || "http://localhost:4000";

export async function POST(req: NextRequest) {
  const { system, settings } = (await req.json()) as {
    system: string;
    settings: Record<string, unknown>;
  };

  const res = await fetch(`${BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, settings }),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
