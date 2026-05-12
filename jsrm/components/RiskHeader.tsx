import type { DailyScore, RiskLevel } from "@/lib/types";
import { LEVEL_COLORS, LEVEL_LABELS_JA } from "@/lib/constants";
import { formatDelta, formatScore } from "@/lib/format";

export default function RiskHeader({ daily }: { daily: DailyScore | null }) {
  if (!daily) {
    return (
      <div className="rounded-lg border border-riskBorder bg-riskPanel p-6">
        <p className="text-riskMuted">まだスコアが計算されていません。`npm run update` を実行してください。</p>
      </div>
    );
  }
  const color = LEVEL_COLORS[daily.level as RiskLevel];
  return (
    <div className="rounded-lg border border-riskBorder bg-riskPanel p-6">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div>
          <div className="text-xs text-riskMuted">{daily.date}</div>
          <div className="text-4xl font-bold">{formatScore(daily.overallScore)}<span className="text-lg text-riskMuted"> / 5</span></div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-sm font-semibold"
          style={{ backgroundColor: color + "33", color }}
        >
          Level {daily.level}「{LEVEL_LABELS_JA[daily.level as RiskLevel]}」
        </div>
        <div className="ml-auto grid grid-cols-3 gap-4 text-sm">
          <Stat label="前日比" value={formatDelta(daily.trend1d)} />
          <Stat label="7日平均との差" value={formatDelta(daily.trend7d)} />
          <Stat label="30日平均との差" value={formatDelta(daily.trend30d)} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-riskMuted">{label}</div>
      <div className="font-mono">{value}</div>
    </div>
  );
}
