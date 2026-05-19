import { LEVEL_LABELS_JA } from "./constants";
import type { RiskLevel } from "./types";

export function formatScore(n: number, digits = 2): string {
  if (!isFinite(n)) return "—";
  return n.toFixed(digits);
}

export function formatDelta(n: number, digits = 2): string {
  if (!isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "" : "±";
  return `${sign}${n.toFixed(digits)}`;
}

export function formatLevelJa(level: RiskLevel): string {
  return `Level ${level}「${LEVEL_LABELS_JA[level]}」`;
}

export function formatDateJa(iso: string): string {
  // expects YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[1]}年${parseInt(m[2], 10)}月${parseInt(m[3], 10)}日`;
}
