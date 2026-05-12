import Layout from "@/components/Layout";
import MethodologyCard from "@/components/MethodologyCard";
import AlertBanner from "@/components/AlertBanner";
import { ALL_CATEGORIES } from "@/lib/types";
import { CATEGORY_LABELS_JA, DEFAULT_WEIGHTS, LEVEL_LABELS_JA } from "@/lib/constants";

export default function MethodologyPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <AlertBanner />
        <h1 className="text-2xl font-bold">方法論</h1>

        <MethodologyCard title="設計目的">
          <p>
            本サイトは「日本が戦争・準戦時体制に巻き込まれる構造的リスク」を、
            公開情報のみから定点観測する記帳システムです。
            予言ではなく、ニュース・公的発表をカテゴリ・重み付きで集計した
            「観測指数」を提供します。
          </p>
        </MethodologyCard>

        <MethodologyCard title="リスクレベル">
          <ul className="list-disc pl-5">
            {Object.entries(LEVEL_LABELS_JA).map(([k, v]) => (
              <li key={k}>
                <span className="font-mono mr-2">Level {k}</span>{v}
              </li>
            ))}
          </ul>
        </MethodologyCard>

        <MethodologyCard title="8 カテゴリと重み">
          <ul className="list-disc pl-5">
            {ALL_CATEGORIES.map((c) => (
              <li key={c}>
                {CATEGORY_LABELS_JA[c]}：weight = {DEFAULT_WEIGHTS[c]}
              </li>
            ))}
          </ul>
        </MethodologyCard>

        <MethodologyCard title="スコア計算式">
          <p>各イベントについて：</p>
          <pre className="bg-riskBg border border-riskBorder rounded p-2 text-xs overflow-x-auto">
{`adjusted_severity = severity × confidence
category_score    = 0.65 × max(adjusted_severity) + 0.35 × avg(adjusted_severity)
overall_score     = Σ (category_score × category_weight)`}
          </pre>
          <p className="text-riskMuted text-xs">
            severity は 0〜5、confidence は 0〜1（一次情報ほど高い）。
            両方を掛け合わせることで、未確認情報が過剰に指数を引き上げないようにしています。
          </p>
        </MethodologyCard>

        <MethodologyCard title="不確実性とバイアス">
          <ul className="list-disc pl-5">
            <li>本指数は公開情報の集約であり、機密情報・水面下の交渉等は反映されない</li>
            <li>センセーショナルな報道は confidence を下げて記帳する</li>
            <li>カテゴリ重みは公開済の固定値で、運営者が個別ニュースに応じて変更しない</li>
            <li>急上昇は注意喚起であって予言ではない</li>
          </ul>
        </MethodologyCard>

        <MethodologyCard title="禁止事項">
          <ul className="list-disc pl-5">
            <li>戦争発生を断定する表現は使わない</li>
            <li>攻撃手法・軍事作戦・脆弱性利用の助言は提供しない</li>
            <li>特定民族・国民への憎悪を煽る表現は使わない</li>
            <li>未確認情報の断定的引用はしない</li>
          </ul>
        </MethodologyCard>
      </div>
    </Layout>
  );
}
