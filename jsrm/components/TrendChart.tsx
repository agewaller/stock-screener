"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { DailyScore } from "@/lib/types";

export default function TrendChart({ history }: { history: DailyScore[] }) {
  const data = history.map((d) => ({
    date: d.date.slice(5),
    score: Number(d.overallScore.toFixed(3)),
    level: d.level,
  }));
  return (
    <div className="rounded-lg border border-riskBorder bg-riskPanel p-4">
      <div className="text-xs text-riskMuted mb-2">トレンド（直近）</div>
      <div className="w-full h-64">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" stroke="#8b94ad" fontSize={11} />
            <YAxis domain={[0, 5]} stroke="#8b94ad" fontSize={11} />
            <Tooltip
              contentStyle={{ background: "#11172a", border: "1px solid #1f2742", color: "#e6ebf5" }}
              labelStyle={{ color: "#8b94ad" }}
            />
            <ReferenceLine y={1.25} stroke="#22c55e" strokeDasharray="3 3" />
            <ReferenceLine y={2.25} stroke="#eab308" strokeDasharray="3 3" />
            <ReferenceLine y={3.25} stroke="#f97316" strokeDasharray="3 3" />
            <ReferenceLine y={4.25} stroke="#ef4444" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="score" stroke="#60a5fa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
