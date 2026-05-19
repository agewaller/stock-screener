import Layout from "@/components/Layout";
import AlertBanner from "@/components/AlertBanner";
import SubscribeForm from "@/components/SubscribeForm";

export default function SubscribePage() {
  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <AlertBanner />
        <h1 className="text-2xl font-bold">メール通知の登録</h1>
        <SubscribeForm />
        <div className="text-xs text-riskMuted leading-relaxed pt-4 border-t border-riskBorder">
          <p>
            メールアドレスはアラート配信のためにのみ使用し、第三者には提供しません。
            登録は確認メールのリンクをクリックして完了します（ダブルオプトイン）。
            すべてのアラートメールに解除リンクを記載しています。
          </p>
        </div>
      </div>
    </Layout>
  );
}
