import Link from "next/link";
import Layout from "@/components/Layout";
import EmailStatusMessage from "@/components/EmailStatusMessage";

export default function ConfirmedPage() {
  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">登録が完了しました</h1>
        <EmailStatusMessage variant="success">
          メール通知の登録が完了しました。リスク指数が設定値を超えた、または急上昇した場合に、
          公開情報に基づく自動通知メールをお送りします。
        </EmailStatusMessage>
        <p className="text-sm text-riskMuted">
          設定はいつでもメール内の解除リンクから停止できます。
        </p>
        <Link href="/" className="inline-block text-blue-400 hover:underline text-sm">
          ダッシュボードへ戻る
        </Link>
      </div>
    </Layout>
  );
}
