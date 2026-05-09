import type { CategoryScore, RiskCategory, RiskLevel } from "@/lib/types";
import { CATEGORY_LABELS_JA, LEVEL_COLORS } from "@/lib/constants";
import { formatScore } from "@/lib/format";

export default function CategoryScores({ categories }: { categories: CategoryScore[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {categories.map((c) => (
        <div key={c.category} className="rounded-lg border border-riskBorder bg-riskPanel p-3">
          <div className="text-xs text-riskMuted">{CATEGORY_LABELS_JA[c.category as RiskCategory]}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-xl font-semibold font-mono">{formatScore(c.score)}</div>
            <div
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: LEVEL_COLORS[c.level as RiskLevel] + "33",
                color: LEVEL_COLORS[c.level as RiskLevel],
              }}
            >
              L{c.level}
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-riskBg overflow-hidden mt-2">
            <div
              className="h-full"
              style={{
                width: `${Math.min(100, (c.score / 5) * 100)}%`,
                backgroundColor: LEVEL_COLORS[c.level as RiskLevel],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
