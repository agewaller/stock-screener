// Reusable presentational form for alert preferences. Used inside SubscribeForm.
"use client";

import { ALL_CATEGORIES } from "@/lib/types";
import { CATEGORY_LABELS_JA } from "@/lib/constants";

export interface AlertPreferenceState {
  alertMinLevel: number;
  spikeAlertsEnabled: boolean;
  categories: string[];
}

export default function AlertPreferenceForm({
  value,
  onChange,
}: {
  value: AlertPreferenceState;
  onChange: (next: AlertPreferenceState) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">通知レベル</label>
        <select
          className="w-full rounded-md bg-riskBg border border-riskBorder px-3 py-2 text-sm"
          value={value.alertMinLevel}
          onChange={(e) =>
            onChange({ ...value, alertMinLevel: parseInt(e.target.value, 10) })
          }
        >
          <option value={1}>Level 1 以上：敏感（グレーゾーン以上で通知）</option>
          <option value={2}>Level 2 以上：標準（危機接近以上で通知・推奨）</option>
          <option value={3}>Level 3 以上：重大時のみ</option>
          <option value={4}>Level 4 以上：緊急時のみ</option>
        </select>
      </div>

      <div className="flex items-start gap-2">
        <input
          id="spike"
          type="checkbox"
          className="mt-1"
          checked={value.spikeAlertsEnabled}
          onChange={(e) =>
            onChange({ ...value, spikeAlertsEnabled: e.target.checked })
          }
        />
        <label htmlFor="spike" className="text-sm">
          急上昇通知を受け取る（前日比・7日比の閾値超過）
        </label>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-riskMuted">
          詳細：通知対象カテゴリ（既定：すべて）
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {ALL_CATEGORIES.map((c) => {
            const checked = value.categories.includes(c);
            return (
              <label key={c} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? Array.from(new Set([...value.categories, c]))
                      : value.categories.filter((x) => x !== c);
                    onChange({ ...value, categories: next });
                  }}
                />
                {CATEGORY_LABELS_JA[c]}
              </label>
            );
          })}
        </div>
      </details>
    </div>
  );
}
