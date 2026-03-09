import { NextResponse } from "next/server";
import { getScheduler } from "@/lib/sources/cron-scheduler";

export const dynamic = "force-dynamic";

export function GET() {
  const states = getScheduler().getSourceStates();
  return NextResponse.json(states);
}
