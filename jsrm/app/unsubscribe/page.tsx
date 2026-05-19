import Link from "next/link";
import Layout from "@/components/Layout";
import EmailStatusMessage from "@/components/EmailStatusMessage";

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const ok = searchParams?.status === "success";
  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">配信停止</h1>
        {ok ? (
          <EmailStatusMessage variant="success">
            メール通知を停止しました。今後、本サイトからアラートメールは送信されません。
          </EmailStatusMessage>
        ) : (
          <EmailStatusMessage variant="info">
            配信停止リンクが無効、または既に解除済みの可能性があります。
            別の解除リンクをお持ちでない場合は、お手元のアラートメール末尾のリンクをご利用ください。
          </EmailStatusMessage>
        )}
        <Link href="/" className="inline-block text-blue-400 hover:underline text-sm">
          ダッシュボードへ戻る
        </Link>
      </div>
    </Layout>
  );
}
