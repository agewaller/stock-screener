import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "日本参戦リスク・主権モニター / Japan Sovereignty Risk Monitor",
  description:
    "公開情報に基づき、日本が戦争・準戦時体制に巻き込まれる構造的リスクを定点観測し、リスク上昇時に希望者へ通知するダッシュボード。戦争を予言・断定するものではありません。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
