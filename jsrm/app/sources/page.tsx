import Layout from "@/components/Layout";
import AlertBanner from "@/components/AlertBanner";
import SourceBadge from "@/components/SourceBadge";
import { loadSources } from "@/lib/loadData";

export const dynamic = "force-dynamic";

export default function SourcesPage() {
  const sources = loadSources();
  return (
    <Layout>
      <div className="space-y-6">
        <AlertBanner />
        <h1 className="text-2xl font-bold">ソース一覧</h1>
        <p className="text-sm text-riskMuted">
          本サイトが参照する公開情報源です。一次情報を優先し、二次報道は補助として参照します。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sources.map((s) => (
            <div key={s.id} className="rounded-lg border border-riskBorder bg-riskPanel p-4">
              <div className="text-xs text-riskMuted">{s.type}</div>
              <div className="font-semibold">
                <SourceBadge name={s.name} url={s.url} />
              </div>
              <p className="text-sm mt-1">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
