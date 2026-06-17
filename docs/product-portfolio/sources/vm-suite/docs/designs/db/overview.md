---
component: db
type: overview
tech: PostgreSQL, geni (migration)
path: db
updated: 2026-04-15
---

# Database

PostgreSQL データベース設計。geni によるマイグレーション管理。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| RDBMS | PostgreSQL |
| マイグレーション | geni |
| ORM (API) | SeaORM (Rust) |
| ORM (Web) | Prisma (TypeScript) |

## テーブル一覧

### リファレンスデータ

| テーブル | 説明 | 件数目安 |
|---------|------|---------|
| `exchanges` | 取引所（TSE, NYSE, NASDAQ 等） | 6 |
| `market_segments` | 市場区分（プライム, スタンダード, グロース等） | 18 |
| `industry_sectors` | TOPIX 業種分類（17セクター） | 18 |
| `industries` | 詳細業種分類（33業種） | 34 |

### 企業データ

| テーブル | 説明 |
|---------|------|
| `companies` | 企業マスタ |
| `listings` | 企業-取引所 関連（多対多） |
| `company_events` | コーポレートイベント |
| `company_analyses` | LLM 分析結果 |

### 財務データ

| テーブル | 説明 |
|---------|------|
| `financial_statements` | 年次財務諸表（PL, BS, CF） |
| `financial_statements_quarterly` | 四半期財務諸表 |
| `financial_metrics` | 財務指標（ROIC, PER, PBR 等） |
| `valuations` | バリュエーションデータ |
| `stock_prices` | 株価データ |

### ユーザー・取引

| テーブル | 説明 |
|---------|------|
| `users` | 一般ユーザーアカウント |
| `admin_users` | 管理者アカウント |
| `trade_settings` | 取引戦略設定 |
| `positions` | ポートフォリオポジション |
| `trade_orders` | 売買注文 |

### 設定

| テーブル | 説明 |
|---------|------|
| `prompts` | LLM 分析プロンプト |

## ER 概念図

```
exchanges ──┐
            ├── listings ──── companies
market_     │                    │
segments ───┘                    │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
              financial    financial     stock_prices
              statements   metrics
                    │
                    ▼
              financial_statements
              _quarterly

industry_sectors ── industries ── companies

companies ── company_events
         ── company_analyses
         ── valuations

users ── trade_settings
     ── positions
     ── trade_orders
```

## マイグレーション履歴

| # | マイグレーション | 内容 |
|---|-----------------|------|
| 1 | `init` | 初期スキーマ |
| 2 | `create_table_exchanges` | 取引所テーブル |
| 3 | `create_table_market_segments` | 市場区分テーブル |
| 4 | `create_table_industry_sectors` | TOPIX セクター分類 |
| 5 | `create_table_industries` | 詳細業種分類 |
| 6 | `create_table_companies` | 企業マスタ |
| 7 | `create_table_financial_statements` | 年次財務諸表 |
| 8 | `create_table_financial_metrics` | 財務指標 |
| 9 | `create_table_valuations` | バリュエーション |
| 10 | `create_table_listings` | 上場情報 |
| 11 | `create_table_stock_prices` | 株価 |
| 12 | `create_table_company_events` | コーポレートイベント |
| 13 | `create_table_admin_users` | 管理者ユーザー |
| 14 | `create_table_users` | 一般ユーザー |
| 15 | `create_table_trade_settings` | 取引設定 |
| 16 | `create_table_positions` | ポジション |
| 17 | `create_table_trade_orders` | 売買注文 |
| 18 | `create_table_prompts` | プロンプト |
| 19 | `seed_vm_prompts` | プロンプト初期データ |
| 20 | `create_table_financial_statements_quarterly` | 四半期財務 |
| 21 | `create_table_company_analyses` | 分析結果 |
| 22 | `add_pl_detail_columns` | PL 詳細カラム追加 |
| 23 | `consolidate_metrics_valuations` | メトリクス・バリュエーション統合 |

## シードデータ

`seed.sql` で以下のリファレンスデータを投入（冪等）:

- **取引所** (6件): TSE, NYSE, NASDAQ, 札幌, 名古屋, 福岡
- **業種セクター** (18件): TOPIX 分類（食品, エネルギー, 建設, 化学, 医薬品 等）
- **詳細業種** (34件): 33業種 + その他
- **市場区分** (18件): プライム, スタンダード, グロース, TOKYO PRO, 旧区分（1部, 2部, マザーズ, JASDAQ）, 米国市場

## マイグレーション操作

```bash
cd db
./migrate.sh up              # 全マイグレーション適用
./migrate.sh new <name>      # 新規マイグレーション作成
./migrate.sh status          # 適用状態確認
./migrate.sh seed            # シードデータ投入
./migrate.sh list            # マイグレーション一覧
```

> ⚠️ `down` / `rollback` は破壊的操作のため、必ずユーザーの許可を得てから実行すること。

## 環境変数

| 変数 | 説明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 接続文字列 |

`.env`, `.env.prod` で環境ごとに管理。`migrate.sh` が多段階で `.env` を読み込む。

## 関連ドキュメント

- [[api/overview]] — REST API（SeaORM 経由で接続）
- [[user-console/overview]] — ユーザーコンソール（Prisma 経由で接続）
- [[admin-console/overview]] — 管理コンソール（Prisma 経由で接続）
- [[desktop-app/overview]] — デスクトップアプリ（VM API 経由で接続）
