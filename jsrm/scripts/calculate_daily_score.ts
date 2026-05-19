// Recompute daily_scores.json from raw_events.json.
//
// Strategy: for each unique date present in raw_events.json, compute the
// daily score using all events ON or BEFORE that date that are not
// "rejected". (Daily score is per-date — events from earlier dates do
// NOT contribute, since the date filter inside buildDailyScore excludes them.)
import fs from "node:fs";
import path from "node:path";
import { buildDailyScore } from "../lib/scoring";
import type { CategoryWeights, DailyScore, RiskEvent } from "../lib/types";
import { DEFAULT_WEIGHTS } from "../lib/constants";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(name: string, fallback: T): T {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function uniqueSortedDates(events: RiskEvent[]): string[] {
  const set = new Set<string>();
  for (const e of events) set.add(e.date);
  return Array.from(set).sort();
}

function main() {
  const rawFile = readJson<{ events: RiskEvent[] }>("raw_events.json", {
    events: [],
  });
  const events = rawFile.events.filter((e) => e.status !== "rejected");
  const weights: CategoryWeights = readJson<CategoryWeights>(
    "weights.json",
    DEFAULT_WEIGHTS,
  );

  const dates = uniqueSortedDates(events);
  const out: DailyScore[] = [];
  for (const d of dates) {
    const ds = buildDailyScore({
      date: d,
      events,
      history: out, // ascending
      weights,
    });
    out.push(ds);
  }

  fs.writeFileSync(
    path.join(DATA_DIR, "daily_scores.json"),
    JSON.stringify({ scores: out }, null, 2) + "\n",
    "utf-8",
  );
  const last = out[out.length - 1];
  if (last) {
    console.log(
      `[score] dates=${out.length} latest=${last.date} score=${last.overallScore.toFixed(3)} level=${last.level}`,
    );
  } else {
    console.log("[score] no events to score");
  }
}

main();
