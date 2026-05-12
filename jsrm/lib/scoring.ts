import { ALL_CATEGORIES, type CategoryScore, type CategoryWeights, type DailyScore, type RiskCategory, type RiskEvent, type RiskLevel } from "./types";
import { DEFAULT_WEIGHTS, scoreToLevel } from "./constants";

// adjusted_severity = severity * confidence
export function adjustedSeverity(e: RiskEvent): number {
  return Math.max(0, Math.min(5, e.severity)) * Math.max(0, Math.min(1, e.confidence));
}

// category_score = 0.65 * max + 0.35 * avg
export function calculateCategoryScore(events: RiskEvent[]): number {
  if (events.length === 0) return 0;
  const adj = events.map(adjustedSeverity);
  const max = Math.max(...adj);
  const avg = adj.reduce((s, x) => s + x, 0) / adj.length;
  return 0.65 * max + 0.35 * avg;
}

export function calculateAllCategoryScores(events: RiskEvent[]): CategoryScore[] {
  return ALL_CATEGORIES.map((category) => {
    const reviewed = events.filter(
      (e) => e.category === category && e.status !== "rejected",
    );
    const score = calculateCategoryScore(reviewed);
    const top = [...reviewed]
      .sort((a, b) => adjustedSeverity(b) - adjustedSeverity(a))
      .slice(0, 5);
    return {
      category,
      score,
      level: scoreToLevel(score),
      topEvents: top,
    };
  });
}

export function calculateOverallScore(
  categoryScores: CategoryScore[],
  weights: CategoryWeights = DEFAULT_WEIGHTS,
): number {
  let total = 0;
  for (const cs of categoryScores) {
    const w = weights[cs.category as RiskCategory];
    total += cs.score * (w ?? 0);
  }
  return total;
}

export function pickTopDrivers(events: RiskEvent[], n = 5): RiskEvent[] {
  return [...events]
    .filter((e) => e.status !== "rejected")
    .sort((a, b) => adjustedSeverity(b) - adjustedSeverity(a))
    .slice(0, n);
}

export interface BuildDailyScoreInput {
  date: string;
  events: RiskEvent[];
  history: DailyScore[]; // ascending by date
  weights?: CategoryWeights;
}

export function buildDailyScore({
  date,
  events,
  history,
  weights = DEFAULT_WEIGHTS,
}: BuildDailyScoreInput): DailyScore {
  const dayEvents = events.filter((e) => e.date === date);
  const categories = calculateAllCategoryScores(dayEvents);
  const overallScore = calculateOverallScore(categories, weights);
  const level: RiskLevel = scoreToLevel(overallScore);

  const yesterday = history[history.length - 1];
  const trend1d = yesterday ? overallScore - yesterday.overallScore : 0;

  const last7 = history.slice(-7);
  const avg7 =
    last7.length > 0
      ? last7.reduce((s, d) => s + d.overallScore, 0) / last7.length
      : overallScore;
  const trend7d = overallScore - avg7;

  const last30 = history.slice(-30);
  const avg30 =
    last30.length > 0
      ? last30.reduce((s, d) => s + d.overallScore, 0) / last30.length
      : overallScore;
  const trend30d = overallScore - avg30;

  return {
    date,
    overallScore,
    level,
    categories,
    trend1d,
    trend7d,
    trend30d,
    topDrivers: pickTopDrivers(dayEvents, 5),
    generatedAt: new Date().toISOString(),
  };
}
