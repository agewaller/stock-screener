---
component: user-console
type: overview
tech: SolidStart, Prisma, Firebase Auth, PandaCSS
path: apps/user-console
updated: 2026-04-15
---

# User Console

企業バリュエーション分析を閲覧するユーザー向け Web アプリケーション。

## 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | SolidStart (Nitro) | 2.0.0-alpha.2 |
| UI | Ark UI + PandaCSS | 5.36.0 / 1.9.1 |
| DB アクセス | Prisma (PostgreSQL) | 7.7.0 |
| 認証 | Firebase Auth | 12.12.0 |
| i18n | @solid-primitives/i18n | 2.2.1 |
| アイコン | Lucide Solid | 1.8.0 |

## ルーティング

```
/                    → /dashboard へリダイレクト
/login               認証（メール/パスワード）
/dashboard           ホーム画面（要認証）
/companies           企業一覧（ページネーション・検索）
/companies/[code]    企業詳細・分析レポート
/settings            ユーザー設定（メール変更・Google連携）
```

`(app)/` 配下のルートは `AuthGuard` で保護される。

## 主要機能

### 企業データ閲覧
- 企業名・証券コードによる検索
- ページネーション（20/50/100件）
- 業種・市場区分の表示

### 財務分析レポート
- ルールベースの自動コメント生成（65+ルール）
- 対象カテゴリ:
  - BS（貸借対照表）: 資産・負債比率
  - PL（損益計算書）: 売上・利益成長率
  - バリュエーション: PER, EV/EBIT, P/CFR
  - ROIC: 資本効率
  - CFマトリクス: 流動性ポジショニング
  - FCF: フリーキャッシュフロー健全性

### バリューチェーン可視化
6段階プロセスフロー: 資金調達 → 配当 → 投資 → 仕入 → 製造 → 販売

### 企業レーティング
VPS（バリュエーション対純資産）に基づく星評価（1〜5）

## ディレクトリ構成

```
src/
├── routes/           ファイルベースルーティング
├── components/
│   └── ui/           32+ 再利用可能UIコンポーネント
├── server/           サーバー関数（"use server"）
│   ├── companies.ts      企業クエリ（Prisma）
│   ├── analysis_comments.ts  分析コメントロジック
│   └── auth.ts           認証ヘルパー
├── lib/              ユーティリティ
│   ├── auth.tsx          認証コンテキスト
│   ├── firebase.ts       Firebase クライアント
│   ├── firebase-admin.ts Firebase Admin SDK
│   └── prisma.ts         Prisma クライアント
├── i18n/             国際化（ja / en）
└── theme/            PandaCSS テーマ設定
    ├── colors/       カラーパレット
    ├── recipes/      コンポーネントレシピ
    └── tokens/       デザイントークン
```

## デプロイ

- `cloudbuild-user.yaml` で Cloud Run にデプロイ
- Dockerfile によるコンテナビルド

## 関連ドキュメント

- [[api/overview]] — REST API
- [[admin-console/overview]] — 管理コンソール
- [[desktop-app/overview]] — デスクトップアプリ
- [[db/overview]] — データベース設計
