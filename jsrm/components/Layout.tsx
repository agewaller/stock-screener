import Link from "next/link";
import { ReactNode } from "react";
import { DISCLAIMER_JA } from "@/lib/constants";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-riskBg text-riskText">
      <header className="border-b border-riskBorder">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
          <Link href="/" className="font-bold text-lg">
            日本参戦リスク・主権モニター
            <span className="ml-2 text-xs text-riskMuted font-normal">JSRM</span>
          </Link>
          <nav className="ml-auto flex gap-4 text-sm">
            <Link href="/" className="hover:text-white text-riskMuted">ダッシュボード</Link>
            <Link href="/methodology" className="hover:text-white text-riskMuted">方法論</Link>
            <Link href="/sources" className="hover:text-white text-riskMuted">ソース</Link>
            <Link href="/about" className="hover:text-white text-riskMuted">このサイトについて</Link>
            <Link href="/subscribe" className="hover:text-white text-white underline">メール通知</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-riskBorder mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-riskMuted leading-relaxed">
          <p className="mb-2">{DISCLAIMER_JA}</p>
          <p>© Japan Sovereignty Risk Monitor (JSRM)</p>
        </div>
      </footer>
    </div>
  );
}
