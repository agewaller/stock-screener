import { LEVEL_COLORS } from "@/lib/constants";
import type { RiskLevel } from "@/lib/types";

export default function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const pct = Math.max(0, Math.min(1, score / 5));
  return (
    <div className="rounded-lg border border-riskBorder bg-riskPanel p-4">
      <div className="text-xs text-riskMuted mb-2">総合リスク指数</div>
      <div className="h-2 rounded-full bg-riskBg overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${pct * 100}%`,
            backgroundColor: LEVEL_COLORS[level],
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-riskMuted mt-1">
        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
      </div>
    </div>
  );
}
