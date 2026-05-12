import { NextResponse } from "next/server";
import { loadDailyScores } from "@/lib/loadData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const scores = loadDailyScores();
  const latest = scores.length > 0 ? scores[scores.length - 1] : null;
  return NextResponse.json({
    latest,
    history: scores.slice(-30),
  });
}
