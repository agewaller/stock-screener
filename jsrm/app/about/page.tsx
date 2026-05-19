import Layout from "@/components/Layout";
import AlertBanner from "@/components/AlertBanner";
import { DISCLAIMER_JA } from "@/lib/constants";

export default function AboutPage() {
  return (
    <Layout>
      <div className="space-y-6 prose-invert max-w-none">
        <AlertBanner />
        <h1 className="text-2xl font-bold">このサイトについて</h1>
        <section className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>日本参戦リスク・主権モニター（JSRM）</strong>は、公開情報に基づき、
            日本が戦争・準戦時体制に巻き込まれる構造的リスクを定点観測するサイトです。
          </p>
          <p>
            「リスク指数」「変化方向」「根拠」「ソース」「不確実性」を透明に示すことを
            目的としており、予言サイトではありません。
          </p>
          <p>{DISCLAIMER_JA}</p>
        </section>
        <section className="text-sm">
          <h2 className="font-semibold mb-2">サイト内ページ</h2>
          <ul className="list-disc pl-5">
            <li>/ — ダッシュボード</li>
            <li>/methodology — 方法論とスコア計算式</li>
            <li>/sources — 参照ソース一覧</li>
            <li>/subscribe — メール通知の登録</li>
            <li>/unsubscribe — メール通知の解除</li>
          </ul>
        </section>
      </div>
    </Layout>
  );
}
