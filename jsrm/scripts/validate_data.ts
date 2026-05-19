// Validate /data files. Exits non-zero on a serious problem so CI fails.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ALL_CATEGORIES } from "../lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

const EventSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(ALL_CATEGORIES as unknown as [string, ...string[]]),
  title: z.string().min(1),
  summary: z.string().default(""),
  sourceName: z.string().min(1),
  sourceUrl: z.string().default(""),
  severity: z.number().min(0).max(5),
  confidence: z.number().min(0).max(1),
  status: z.enum(["raw", "reviewed", "rejected"]),
  tags: z.array(z.string()).optional(),
  collectedAt: z.string(),
});

const RawSchema = z.object({ events: z.array(EventSchema) });

const DailyScoreSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overallScore: z.number(),
  level: z.number().int().min(0).max(5),
  trend1d: z.number(),
  trend7d: z.number(),
  trend30d: z.number(),
});
const DailyFileSchema = z.object({
  scores: z.array(DailyScoreSchema.passthrough()),
});

function readJson(name: string): unknown {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function main() {
  const issues: string[] = [];

  const raw = readJson("raw_events.json");
  if (raw == null) {
    issues.push("raw_events.json missing");
  } else {
    const r = RawSchema.safeParse(raw);
    if (!r.success) issues.push(`raw_events.json invalid: ${r.error.toString()}`);
    else {
      const ids = new Set<string>();
      for (const e of r.data.events) {
        if (ids.has(e.id)) issues.push(`duplicate event id: ${e.id}`);
        ids.add(e.id);
      }
    }
  }

  const daily = readJson("daily_scores.json");
  if (daily == null) {
    issues.push("daily_scores.json missing");
  } else {
    const d = DailyFileSchema.safeParse(daily);
    if (!d.success) issues.push(`daily_scores.json invalid: ${d.error.toString()}`);
  }

  const weights = readJson("weights.json") as Record<string, number> | null;
  if (weights) {
    const sum = Object.values(weights).reduce((s, x) => s + x, 0);
    if (Math.abs(sum - 1) > 0.001) {
      issues.push(`weights.json sum != 1 (sum=${sum.toFixed(4)})`);
    }
  }

  if (issues.length > 0) {
    console.error("[validate] FAIL");
    for (const i of issues) console.error(" - " + i);
    process.exit(1);
  } else {
    console.log("[validate] ok");
  }
}

main();
