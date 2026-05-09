// Stub fetcher: GDELT補完情報
import type { RiskEvent } from "../lib/types";

export async function fetchGdelt(today: string): Promise<RiskEvent[]> {
  return [
    {
      id: `gdelt_${today}`,
      date: today,
      category: "cyber_information_warfare",
      title: "[stub] GDELT 補助シグナル",
      summary:
        "本イベントはローカル開発用のスタブです。本番では GDELT 2.0 GKG をクエリしてください。",
      sourceName: "GDELT (stub)",
      sourceUrl: "https://www.gdeltproject.org/",
      severity: 0.8,
      confidence: 0.4,
      status: "raw",
      tags: ["stub"],
      collectedAt: new Date().toISOString(),
    },
  ];
}
