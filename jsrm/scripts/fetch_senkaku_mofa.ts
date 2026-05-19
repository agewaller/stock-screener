// Stub fetcher: 外務省 - 尖閣諸島周辺海域における中国公船等の動向
import type { RiskEvent } from "../lib/types";

export async function fetchSenkakuMofa(today: string): Promise<RiskEvent[]> {
  return [
    {
      id: `mofa_senkaku_${today}`,
      date: today,
      category: "senkaku_east_china_sea",
      title: "[stub] 尖閣周辺海域での公船活動",
      summary:
        "本イベントはローカル開発用のスタブです。本番では mofa.go.jp の公開発表を取得してください。",
      sourceName: "外務省 (stub)",
      sourceUrl: "https://www.mofa.go.jp/mofaj/area/senkaku/",
      severity: 1.5,
      confidence: 0.7,
      status: "raw",
      tags: ["stub"],
      collectedAt: new Date().toISOString(),
    },
  ];
}
