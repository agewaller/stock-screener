import type { RiskEvent, RiskCategory } from "@/lib/types";
import { CATEGORY_LABELS_JA } from "@/lib/constants";
import SourceBadge from "./SourceBadge";

export default function EventTable({ events, title }: { events: RiskEvent[]; title?: string }) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-riskBorder bg-riskPanel p-4 text-sm text-riskMuted">
        {title ?? "イベント"} はありません。
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-riskBorder bg-riskPanel overflow-hidden">
      {title && <div className="px-4 py-2 border-b border-riskBorder text-sm font-semibold">{title}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-riskMuted text-xs">
            <tr>
              <th className="text-left px-3 py-2">日付</th>
              <th className="text-left px-3 py-2">カテゴリ</th>
              <th className="text-left px-3 py-2">概要</th>
              <th className="text-left px-3 py-2">重み</th>
              <th className="text-left px-3 py-2">ソース</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const adj = (e.severity * e.confidence).toFixed(2);
              return (
                <tr key={e.id} className="border-t border-riskBorder">
                  <td className="px-3 py-2 font-mono text-xs">{e.date}</td>
                  <td className="px-3 py-2 text-xs">
                    {CATEGORY_LABELS_JA[e.category as RiskCategory] ?? e.category}
                  </td>
                  <td className="px-3 py-2">{e.title}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {e.severity.toFixed(1)}×{e.confidence.toFixed(2)}={adj}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <SourceBadge name={e.sourceName} url={e.sourceUrl} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
