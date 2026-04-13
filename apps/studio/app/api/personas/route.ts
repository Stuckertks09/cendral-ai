// apps/studio/app/api/personas/route.ts
import { NextResponse } from "next/server";

const BASE = process.env.SIM_BACKEND_URL || "http://localhost:4000";

export async function GET() {
  const res = await fetch(`${BASE}/api/personas`);
  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.status });
}
