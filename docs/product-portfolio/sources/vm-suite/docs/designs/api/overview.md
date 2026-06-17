---
component: api
type: overview
tech: Rust, Axum, SeaORM, PostgreSQL, Firebase Auth
path: apps/api
updated: 2026-04-15
---

# API

企業データ・財務分析・取引管理を提供する REST API サーバーおよびバッチジョブ。

## 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| Web フレームワーク | Axum | 0.8.8 |
| ORM | SeaORM (PostgreSQL) | ~2.0-rc.36 |
| 非同期ランタイム | Tokio | 1.50.0 |
| 認証 | Firebase Admin SDK + JWT | 0.2 / 9 |
| HTTP クライアント | Reqwest | 0.13.2 |
| LLM 連携 | rig-core (OpenAI) | 0.31.0 |
| データ処理 | calamine (Excel), csv, flate2 | — |
| SVG 生成 | svg | 0.18 |
| トレーシング | tracing + tracing-subscriber | 0.1.44 |
| ミドルウェア | tower-http (CORS, Trace) | 0.6.8 |
| エラー処理 | thiserror + anyhow | 2.0.18 |

## バイナリ

| 名前 | 説明 |
|------|------|
| `api` | HTTP サーバー（デフォルト） |
| `jobs` | バッチジョブ CLI |

## アーキテクチャ

Clean Architecture を採用。レイヤー間は trait で疎結合。

```
┌─────────────────────────────────────────────────┐
│                Presentation Layer                │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Handlers │  │   Routes   │  │ Extractors │  │
│  └────┬─────┘  └────────────┘  │  (Auth)    │  │
│       │                        └────────────┘  │
├───────┼─────────────────────────────────────────┤
│       ▼        Application Layer                │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐   │
│  │ UseCases │  │ Services │  │    DTOs    │   │
│  └────┬─────┘  └──────────┘  └────────────┘   │
│       │                                         │
├───────┼─────────────────────────────────────────┤
│       ▼          Domain Layer                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Entities │  │ Repositories │  │ Gateways │ │
│  │          │  │   (traits)   │  │ (traits) │ │
│  └──────────┘  └──────────────┘  └──────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│              Infrastructure Layer               │
│  ┌──────────────────┐  ┌────────────────────┐  │
│  │ SeaORM Repos     │  │ External Gateways  │  │
│  │ (impl traits)    │  │ ┌────────────────┐ │  │
│  │ ┌──────────────┐ │  │ │ J-Quants API   │ │  │
│  │ │ Converters   │ │  │ ├────────────────┤ │  │
│  │ ├──────────────┤ │  │ │ Firebase Admin  │ │  │
│  │ │ Transaction  │ │  │ └────────────────┘ │  │
│  │ │ Context      │ │  └────────────────────┘  │
│  │ └──────────────┘ │                           │
│  └──────────────────┘                           │
└─────────────────────────────────────────────────┘
```

## API エンドポイント

### ヘルスチェック

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/health` | ヘルスチェック |

### 企業

| メソッド | パス | 説明 | パラメータ |
|---------|------|------|-----------|
| `GET` | `/companies` | 企業一覧・検索 | `q`, `limit` |
| `GET` | `/companies/{code}` | 企業詳細 | `with=full` で全リレーション |

### スクリーニング

| メソッド | パス | 説明 | ボディ |
|---------|------|------|-------|
| `POST` | `/screening` | VM分析スクリーニング | `{ date?: "yyyymmdd" }` |

### 財務グラフ (SVG)

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/companies/{code}/graphs/bs` | 貸借対照表 |
| `GET` | `/companies/{code}/graphs/pl` | 損益計算書 |
| `GET` | `/companies/{code}/graphs/cf` | キャッシュフロー |
| `GET` | `/companies/{code}/graphs/dcf` | DCF バリュエーション |
| `GET` | `/companies/{code}/graphs/multiples` | バリュエーション倍率 |
| `GET` | `/companies/{code}/graphs/roic` | ROIC 分析 |
| `GET` | `/companies/{code}/graphs/value_chain` | バリューチェーン |

### 取引設定 (CRUD)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| `GET` | `/trade_settings` | 一覧 | User |
| `POST` | `/trade_settings` | 作成 | User |
| `GET` | `/trade_settings/{id}` | 取得 | User |
| `PUT` | `/trade_settings/{id}` | 更新 | User |
| `DELETE` | `/trade_settings/{id}` | 削除 | User |

### ポジション (CRUD)

| メソッド | パス | 説明 | パラメータ |
|---------|------|------|-----------|
| `GET` | `/positions` | 一覧 | `env` (default: prod) |
| `POST` | `/positions` | 作成 | — |
| `GET` | `/positions/{id}` | 取得 | — |
| `PUT` | `/positions/{id}` | 更新 | — |
| `DELETE` | `/positions/{id}` | 削除 | — |

### 売買注文 (CRUD)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| `GET` | `/trade_orders` | 一覧 | User |
| `POST` | `/trade_orders` | 作成 | User |
| `GET` | `/trade_orders/{id}` | 取得 | User |
| `PUT` | `/trade_orders/{id}` | 更新 | User |
| `DELETE` | `/trade_orders/{id}` | 削除 | User |

## 認証

Firebase Auth の JWT トークンを `Authorization: Bearer <token>` ヘッダーで受け取る。

| Extractor | テーブル | 用途 |
|-----------|---------|------|
| `User` | `users` | 一般ユーザー操作 |
| `AdminUser` | `admin_users` | 管理者操作（suspended は 403） |

Firebase 未設定時は JWT を署名検証なしでデコード（開発用フォールバック）。

## ドメインエンティティ

### 企業データ

| エンティティ | 説明 |
|-------------|------|
| `Company` | 企業マスタ（取引所・市場区分・業種・財務リレーション付き） |
| `Exchange` | 取引所 |
| `MarketSegment` | 市場区分 |
| `FinancialStatement` | 年次財務諸表（PL, BS, CF） |
| `FinancialStatementQuarterly` | 四半期財務諸表 |
| `FinancialMetric` | 財務指標（DCF, PER, ROIC 等） |
| `CompanyAnalysis` | VM モジュール分析結果（vm01〜vm11） |
| `StockPrice` | 日次株価 |
| `Listing` | 上場情報 |
| `Valuation` | バリュエーション |

### ユーザー・取引

| エンティティ | 説明 |
|-------------|------|
| `User` | 一般ユーザー |
| `AdminUser` | 管理者 |
| `Position` | ポートフォリオポジション |
| `TradeOrder` | 売買注文 |
| `TradeSetting` | 取引戦略設定 |

## バッチジョブ

```bash
cargo run --bin jobs list              # ジョブ一覧
cargo run --bin jobs <name> [args]     # ジョブ実行
```

| ジョブ名 | 説明 |
|---------|------|
| `daily-pipeline` | マスターパイプライン: sync-jquants → calc-metrics → analyze-company |
| `sync-jquants` | J-Quants データ同期（サブコマンド: master, prices, financials, details） |
| `calc-metrics` | 財務指標計算（DCF, PER, ROIC 等） |
| `analyze-company` | LLM による VM モジュール分析（vm_common, vm01〜vm11） |
| `import-legacy-mysql` | レガシー MySQL からインポート |
| `validate-financials` | データ整合性検証・CSV エクスポート |

### daily-pipeline フロー

```
sync-jquants (prices/financials/details)
    → calc-metrics
    → analyze-company (当日更新分)
```

## 外部 API 連携

### J-Quants API

- 企業マスタ（上場情報）の取得
- 日次株価（OHLCV）の取得
- 財務諸表（決算サマリー + 明細）の取得
- 4桁証券コードでの重複排除

### Firebase Admin SDK

- JWT トークン検証
- ユーザー管理（CRUD）
- テナント分離（管理者 / 一般ユーザー）

### OpenAI (via rig-core)

- VM モジュール分析（推論モデル o1 使用）
- プロンプトベースの企業分析

## リポジトリパターン

**TransactionContext** を介してリポジトリにアクセス:

```
TransactionContextFactory
    → TransactionContext を生成
        → CompanyRepository
        → FinancialStatementRepository
        → PositionRepository
        → ...（全リポジトリ）
```

- トランザクション内で複数リポジトリの操作をアトミックに実行
- Converter 層で SeaORM エンティティ ↔ ドメインエンティティを変換

## エラーハンドリング

| AppError | HTTP Status | 説明 |
|----------|-------------|------|
| `NotFound` | 404 | リソース未発見 |
| `Unauthorized` | 401 | 認証失敗 |
| `Forbidden` | 403 | 権限不足 |
| `Validation(msg)` | 400 | バリデーションエラー |
| `Database(msg)` | 500 | DB エラー（汎用メッセージで応答） |
| `Internal(err)` | 500 | 内部エラー（汎用メッセージで応答） |

## ミドルウェア

- **CORS**: `CorsLayer` — 全オリジン許可（開発用）
- **Tracing**: `TraceLayer` — リクエスト/レスポンスのトレーシング
- **ログ**: `RUST_LOG` 環境変数で制御

## 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 接続文字列 |
| `JQUANTS_API_KEY` | ✅ | J-Quants API キー |
| `SERVER_HOST` | — | サーバーホスト（default: `0.0.0.0`） |
| `SERVER_PORT` / `PORT` | — | サーバーポート（default: `3000`） |
| `APP_ENV` | — | 環境名（`.env.{APP_ENV}` を読み込み） |
| `GOOGLE_APPLICATION_CREDENTIALS` | — | Firebase サービスアカウント JSON パス |
| `ADMIN_TENANT_ID` | — | 管理者テナント ID |
| `USERS_TENANT_ID` | — | ユーザーテナント ID |
| `OPENAI_API_KEY` | — | LLM 分析ジョブ用 |
| `RUST_LOG` | — | トレーシングレベル |

## デプロイ

- `cloudbuild.yaml` で Cloud Run にデプロイ

## ディレクトリ構成

```
src/
├── main.rs                   API サーバーエントリーポイント
├── lib.rs                    ライブラリルート
├── container.rs              DI コンテナ
├── error.rs                  エラー型定義
├── config/
│   └── settings.rs           環境設定
├── domain/
│   ├── entities/             ドメインモデル
│   ├── repositories/         リポジトリ trait
│   └── gateways/             外部 API gateway trait
├── application/
│   ├── usecases/             ビジネスロジック
│   ├── services/             サービス（SVG 生成等）
│   ├── dto/                  データ転送オブジェクト
│   └── ports/                インターフェース定義
├── infrastructure/
│   ├── db/sea_orm/
│   │   ├── entities/         SeaORM 自動生成エンティティ
│   │   ├── repositories/     リポジトリ実装
│   │   ├── converters/       ドメイン ↔ DB 変換
│   │   └── transaction_context.rs
│   └── gateways/
│       ├── firebase/         Firebase Admin SDK
│       └── jquants/          J-Quants API クライアント
├── presentation/
│   ├── handlers/             エンドポイントハンドラ
│   ├── routes/mod.rs         ルート定義
│   ├── extractors/auth.rs    認証エクストラクタ
│   └── dto/                  レスポンス DTO
├── bin/
│   ├── main.rs               Jobs CLI エントリーポイント
│   └── jobs/                 バッチジョブ実装
├── data/                     データファイル・テンプレート
├── prompts/                  LLM プロンプト定義
└── scripts/                  ユーティリティスクリプト
```

## 関連ドキュメント

- [[user-console/overview]] — ユーザーコンソール（API 経由でグラフ取得）
- [[admin-console/overview]] — 管理コンソール
- [[desktop-app/overview]] — デスクトップアプリ（API 経由でデータ取得）
- [[db/overview]] — データベース設計
