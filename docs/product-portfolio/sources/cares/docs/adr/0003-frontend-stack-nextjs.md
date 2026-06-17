# ADR-0003: フロントエンド: Next.js + Tailwind + shadcn/ui

- Status: Accepted
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）

## Context

現行は vanilla JS + 13 モジュール SPA（`index.html` + `js/*.js`、ビルド工程なし）。コード品質・保守性の限界が転換動機の一部（ADR-0001）。新仕様では型安全性、テスト容易性、アクセシビリティ、開発生産性を重視する。

ValuationMatrix のフロントエンド技術スタックは未定のため、cares で最良の選択をして後から VM を寄せる方針。

## Decision

| 項目 | 採用 |
|---|---|
| 言語 | **TypeScript** |
| フレームワーク | **Next.js (App Router / SSR 中心)** |
| UI ライブラリ | **Tailwind CSS + shadcn/ui** |
| PWA | **継続**（Service Worker / オフラインアプリシェル / ホーム画面追加） |
| ホスティング | **Cloud Run** |
| 状態管理 | 必要に応じて Zustand / TanStack Query（MVP では決め打ちしない） |
| i18n | next-intl 等を検討（フェーズ 3 で詳細決定） |

### レンダリング戦略

- App Router + React Server Components（RSC）を中心に使う
- DB / Secret Manager にアクセスする計算はサーバ側で完結
- ブラウザに送るデータを最小化（ADR-0007 のブラウザ PII 禁止原則と整合）

### PWA 実装

- App Router と Service Worker の相性に注意。`serwist` または `@ducanh2912/next-pwa` 系を採用
- オフラインキャッシュは **アプリシェル（HTML/CSS/JS）のみ**。ユーザーデータはオンライン必須

## Consequences

### 良い面

- 型安全性・テスト容易性・IDE 補完が改善
- shadcn/ui は Radix UI ベースでアクセシビリティ良好（65 歳ペルソナと整合）
- RSC で「DB に近い計算をサーバで実行、ブラウザに送るデータを最小化」が実現でき、データ主権原則と整合
- Next.js / Tailwind / shadcn/ui はエコシステム最大級。学習リソース・ライブラリ豊富

### 悪い面

- vanilla JS から大きなパラダイムシフト。既存コードはほぼ流用できない
- App Router + RSC + Service Worker（PWA）の組み合わせは設定が繊細
- shadcn/ui はコピペ式なので、アップデート時のメンテナンス責任は自社持ち

### 派生タスク

- アクセシビリティガイドライン策定（フォントサイズ・コントラスト・タップ領域）
- i18n 戦略の詳細設計（フェーズ 3）
- PWA 実装の詳細（Service Worker 設計、キャッシュ戦略）
- shadcn/ui のテーマカスタマイズ（cares ブランドカラー）

## Alternatives Considered

- **vanilla JS 継続**: 動機（コード品質・保守性）に応えられない。
- **Vite + React (CSR / SPA)**: シンプルだが SSR の優位性（初期描画速度、SEO）を捨てる。65 歳ペルソナの遅い回線で初期描画が遅いのは UX 損失。
- **Vue / Nuxt / SvelteKit / SolidStart**: エコシステム規模で React に劣る。生産性最優先の方針に合わない。
- **Pages Router**: 安定だが将来性が薄れている。新規プロジェクトで App Router を選ばない理由が乏しい。
- **Material UI / Chakra UI**: 完成度高いが「コピペでカスタマイズ」が難しく、データ主権方針と整合する細かい改変がやりにくい。
