// Stub fetcher: 防衛省 統合幕僚監部 報道発表
import type { RiskEvent } from "../lib/types";

export async function fetchJointStaff(today: string): Promise<RiskEvent[]> {
  return [
    {
      id: `js_${today}`,
      date: today,
      category: "us_japan_operational_integration",
      title: "[stub] 統幕報道発表（共同訓練・緊急発進等）",
      summary:
        "本イベントはローカル開発用のスタブです。本番では mod.go.jp/js の報道発表をクロールしてください。",
      sourceName: "防衛省 統合幕僚監部 (stub)",
      sourceUrl: "https://www.mod.go.jp/js/",
      severity: 1.2,
      confidence: 0.7,
      status: "raw",
      tags: ["stub"],
      collectedAt: new Date().toISOString(),
    },
  ];
}
