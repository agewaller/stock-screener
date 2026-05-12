// Stub fetcher: 首相官邸 - 北朝鮮ミサイル等関連発表
import type { RiskEvent } from "../lib/types";

export async function fetchKanteiNK(today: string): Promise<RiskEvent[]> {
  return [
    {
      id: `kantei_nk_${today}`,
      date: today,
      category: "north_korea",
      title: "[stub] 首相官邸の北朝鮮関連公表",
      summary:
        "本イベントはローカル開発用のスタブです。本番では kantei.go.jp の発表ページから取得してください。",
      sourceName: "首相官邸 (stub)",
      sourceUrl: "https://www.kantei.go.jp/",
      severity: 1.0,
      confidence: 0.6,
      status: "raw",
      tags: ["stub"],
      collectedAt: new Date().toISOString(),
    },
  ];
}
