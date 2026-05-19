import Link from "next/link";
import Layout from "@/components/Layout";
import RiskHeader from "@/components/RiskHeader";
import RiskGauge from "@/components/RiskGauge";
import CategoryScores from "@/components/CategoryScores";
import TrendChart from "@/components/TrendChart";
import EventTable from "@/components/EventTable";
import AlertBanner from "@/components/AlertBanner";
import { loadDailyScores } from "@/lib/loadData";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const history = loadDailyScores();
  const latest = history.length > 0 ? history[history.length - 1] : null;
  return (
    <Layout>
      <div className="space-y-6">
        <AlertBanner />
        <RiskHeader daily={latest} />

        {latest && (
          <>
            <RiskGauge score={latest.overallScore} level={latest.level} />
            <section>
              <h2 className="text-sm font-semibold mb-2 text-riskMuted">カテゴリ別スコア（8 領域）</h2>
              <CategoryScores categories={latest.categories} />
            </section>

            <TrendChart history={history.slice(-30)} />

            <section>
              <h2 className="text-sm font-semibold mb-2 text-riskMuted">本日の上昇要因 トップ5</h2>
              <EventTable events={latest.topDrivers} />
            </section>
          </>
        )}

        <section className="rounded-lg border border-riskBorder bg-riskPanel p-5">
          <h2 className="font-semibold mb-1">リスク上昇時にメールで通知を受け取る</h2>
          <p className="text-sm text-riskMuted mb-3">
            リスク指数が設定値を超えた、または急上昇した場合にメール通知が届きます。
            登録は無料、いつでも解除できます。
          </p>
          <Link
            href="/subscribe"
            className="inline-block rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium"
          >
            メール通知に登録する
          </Link>
        </section>
      </div>
    </Layout>
  );
}
