import fs from "node:fs";
import path from "node:path";
import type {
  CategoryWeights,
  DailyScore,
  DailyScoresFile,
  RawEventsFile,
  RiskEvent,
  SourceInfo,
  SourcesFile,
} from "./types";
import { DEFAULT_WEIGHTS } from "./constants";

const DATA_DIR = path.join(process.cwd(), "data");

function readJsonSafe<T>(file: string, fallback: T): T {
  const full = path.join(DATA_DIR, file);
  try {
    if (!fs.existsSync(full)) return fallback;
    const txt = fs.readFileSync(full, "utf-8");
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
}

export function loadRawEvents(): RiskEvent[] {
  const file = readJsonSafe<RawEventsFile>("raw_events.json", { events: [] });
  return file.events;
}

export function loadDailyScores(): DailyScore[] {
  const file = readJsonSafe<DailyScoresFile>("daily_scores.json", { scores: [] });
  return [...file.scores].sort((a, b) => a.date.localeCompare(b.date));
}

export function loadSources(): SourceInfo[] {
  const file = readJsonSafe<SourcesFile>("sources.json", { sources: [] });
  return file.sources;
}

export function loadWeights(): CategoryWeights {
  return readJsonSafe<CategoryWeights>("weights.json", DEFAULT_WEIGHTS);
}

export function writeJson(file: string, data: unknown): void {
  const full = path.join(DATA_DIR, file);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export function getLatestDailyScore(): DailyScore | null {
  const scores = loadDailyScores();
  return scores.length > 0 ? scores[scores.length - 1] : null;
}
