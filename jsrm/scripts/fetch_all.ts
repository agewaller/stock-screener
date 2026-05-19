// Orchestrator: pulls events from each source, merges with manual events,
// dedupes by id, and writes the result to data/raw_events.json.
//
// Note: per-source fetchers currently return STUB data so the pipeline runs
// end-to-end without external network access. Replace each fetch_*.ts
// with a real implementation pointing at the actual public source.
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import type { RiskEvent } from "../lib/types";
import { fetchTaiwanMnd } from "./fetch_taiwan_mnd";
import { fetchSenkakuMofa } from "./fetch_senkaku_mofa";
import { fetchJointStaff } from "./fetch_joint_staff";
import { fetchKanteiNK } from "./fetch_kantei_nk";
import { fetchGdelt } from "./fetch_gdelt";

const DATA_DIR = path.join(process.cwd(), "data");

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadExisting(): RiskEvent[] {
  const p = path.join(DATA_DIR, "raw_events.json");
  if (!fs.existsSync(p)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf-8"));
    return j.events ?? [];
  } catch {
    return [];
  }
}

function loadManualCsv(): RiskEvent[] {
  const p = path.join(DATA_DIR, "manual_events.csv");
  if (!fs.existsSync(p)) return [];
  const text = fs.readFileSync(p, "utf-8");
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data
    .filter((r) => r && r.id && r.date && r.category)
    .map((r) => ({
      id: r.id,
      date: r.date,
      category: r.category as RiskEvent["category"],
      title: r.title || "",
      summary: r.summary || "",
      sourceName: r.sourceName || "manual",
      sourceUrl: r.sourceUrl || "",
      severity: parseFloat(r.severity || "0"),
      confidence: parseFloat(r.confidence || "0.7"),
      status: (r.status as RiskEvent["status"]) || "reviewed",
      tags: (r.tags || "")
        .split(/[|,]/)
        .map((t) => t.trim())
        .filter(Boolean),
      collectedAt: new Date().toISOString(),
    }));
}

async function main() {
  const today = todayIso();
  const existing = loadExisting();
  const manual = loadManualCsv();
  const fetched = (
    await Promise.all([
      fetchTaiwanMnd(today),
      fetchSenkakuMofa(today),
      fetchJointStaff(today),
      fetchKanteiNK(today),
      fetchGdelt(today),
    ])
  ).flat();

  const byId = new Map<string, RiskEvent>();
  for (const e of existing) byId.set(e.id, e);
  // manual / fetched override existing with same id
  for (const e of fetched) byId.set(e.id, e);
  for (const e of manual) byId.set(e.id, e);

  const all = Array.from(byId.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  fs.writeFileSync(
    path.join(DATA_DIR, "raw_events.json"),
    JSON.stringify({ events: all }, null, 2) + "\n",
    "utf-8",
  );
  console.log(
    `[fetch_all] events=${all.length} manual=${manual.length} fetched=${fetched.length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
