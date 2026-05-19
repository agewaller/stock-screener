// Stub fetcher: Taiwan MND PLA activity around Taiwan.
//
// Production should hit the official MND daily release page and parse
// the structured tables (or use a community-maintained mirror like
// https://github.com/CIA-CITGuard/PLA-Daily-Activity if appropriate).
// For the MVP this returns synthetic placeholder events so that the
// pipeline runs end-to-end without external network access.
import type { RiskEvent } from "../lib/types";

export async function fetchTaiwanMnd(today: string): Promise<RiskEvent[]> {
  return [
    {
      id: `mnd_tw_${today}`,
      date: today,
      category: "taiwan_strait",
      title: "[stub] 公開発表に基づく台湾周辺の中国軍機・艦艇活動",
      summary:
        "本イベントはローカル開発用のスタブです。本番では Taiwan MND の日次公表をパースしてください。",
      sourceName: "Taiwan MND (stub)",
      sourceUrl: "https://www.mnd.gov.tw/",
      severity: 1.8,
      confidence: 0.7,
      status: "raw",
      tags: ["stub"],
      collectedAt: new Date().toISOString(),
    },
  ];
}
