---
component: admin-console
type: overview
tech: SolidStart, Prisma, Firebase Auth, PandaCSS (Park UI)
path: apps/admin-console
updated: 2026-04-15
---

# Admin Console

企業データ・ユーザー・プロンプトなどを管理する管理者向け Web アプリケーション。

## 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | SolidStart (Nitro) | 2.0.0-alpha.2 |
| UI | Ark UI + PandaCSS (Park UI) | 5.34.1 / 1.9.0 |
| DB アクセス | Prisma (PostgreSQL) | 7.5.0 |
| 認証 | Firebase Auth (Admin テナント) | 12.11.0 |
| バリデーション | Zod | 4.3.6 |
| アイコン | Lucide Solid | 0.577.0 |

## ルーティング

```
/                    → /login または /dashboard へリダイレクト
/login               管理者認証
/dashboard           ダッシュボード（統計カード）
/users               一般ユーザー管理（CRUD）
/users/[id]          ユーザー詳細
/users/[id]/edit     ユーザー編集
/users/new           ユーザー新規作成
/admin-users         管理者ユーザー管理（CRUD）
/companies           企業データ管理
/companies/[id]      企業詳細
/prompts             分析プロンプト管理（CRUD）
/prompts/[id]        プロンプト詳細
/prompts/[id]/edit   プロンプト編集
/prompts/new         プロンプト新規作成
/prices              株価データ
/financials          財務データ
/jobs                ジョブ管理
/metrics             メトリクス・分析
/api/health          ヘルスチェック
```

## 主要機能

### ユーザー管理
- 一般ユーザー・管理者ユーザーの CRUD 操作
- パスワード変更ダイアログ
- Firebase Auth テナント分離（管理者テナント / ユーザーテナント）

### 企業データ管理
- 企業マスタの閲覧・編集
- 財務データの確認
- 株価データの管理

### プロンプト管理
- LLM 分析用プロンプトの CRUD
- Zod バリデーションによる入力検証

### ジョブ管理
- バッチジョブの実行・監視

### ダッシュボード
- StatCard による主要指標の表示

## ディレクトリ構成

```
src/
├── routes/
│   ├── (app)/            保護されたルート群
│   │   ├── admin-users/  管理者ユーザー CRUD
│   │   ├── companies/    企業管理
│   │   ├── users/        一般ユーザー CRUD
│   │   ├── prompts/      プロンプト CRUD
│   │   ├── prices/       株価
│   │   ├── dashboard.tsx
│   │   ├── financials.tsx
│   │   ├── jobs.tsx
│   │   └── metrics.tsx
│   └── api/              サーバー API
├── components/
│   ├── ui/               60+ UI コンポーネント
│   ├── page/             ページパターン
│   │   ├── DataTable     データテーブル
│   │   ├── FormCard      フォームカード
│   │   ├── DetailCard    詳細カード
│   │   └── PageHeader    ページヘッダー
│   └── dialog/           ダイアログ
├── server/               サーバー関数（"use server"）
│   ├── users.ts          ユーザー操作
│   ├── admin-users.ts    管理者操作
│   ├── companies.ts      企業操作
│   ├── prompts.ts        プロンプト操作
│   ├── stock-prices.ts   株価データ
│   └── dashboard.ts      ダッシュボード集計
├── lib/
│   ├── prisma.ts         Prisma クライアント
│   ├── firebase-admin.ts Firebase Admin SDK
│   ├── auth.tsx          認証コンテキスト
│   ├── env.ts            環境変数
│   └── collections.ts    コレクションヘルパー
└── theme/                PandaCSS テーマ
    ├── colors/           カラートークン
    ├── recipes/          60+ コンポーネントレシピ
    └── tokens/           デザイントークン
```

## 再利用可能ページパターン

管理画面の CRUD は共通パターンで構築されている:

- **ListPage** — ページネーション・検索付き一覧
- **DataTable** — カラム定義・ソート・リンク付きテーブル
- **FormCard** — Zod バリデーション付きフォーム
- **DetailCard** — エンティティ詳細表示
- **ConfirmDialog** — 破壊的操作の確認

## デプロイ

- `cloudbuild-admin.yaml` で Cloud Run にデプロイ

## 関連ドキュメント

- [[api/overview]] — REST API
- [[user-console/overview]] — ユーザーコンソール
- [[desktop-app/overview]] — デスクトップアプリ
- [[db/overview]] — データベース設計
