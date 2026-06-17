---
component: desktop-app
type: overview
tech: Tauri, SolidJS, Rust, Firebase Auth, Tailwind CSS
path: apps/vm-app
updated: 2026-04-15
---

# Desktop App (vm-app)

株式スクリーニング・自動売買を行うデスクトップトレーディングアプリケーション。

## 技術スタック

### フロントエンド

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | SolidJS + SolidStart | 1.9.5 / 1.1.0 |
| UI | Ark UI + Kobalte | 5.31.0 / 0.13.11 |
| スタイリング | Tailwind CSS | 4.2.0 |
| フォーム | Felte + Zod | 1.2.14 |
| 認証 | Firebase | 12.9.0 |
| Markdown | Marked | 17.0.5 |
| アイコン | Lucide Solid | 0.575.0 |

### バックエンド (Rust)

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| デスクトップ | Tauri | 2.10.0 |
| 非同期 | Tokio | 1.x |
| HTTP | Reqwest | 0.12 |
| 暗号化 | AES-GCM | 0.10 |
| ストレージ | Tauri Store Plugin | 2.4.2 |

## ページ構成

| ページ | 機能 |
|-------|------|
| Screening | 銘柄スクリーニング・フィルタリング |
| AutoTrade | 自動売買エンジン |
| Position | ポートフォリオポジション管理 |
| TradeSettings | 取引戦略設定 |
| Karte | 売買記録・ログ |
| Trading | 手動取引（テスト用） |
| Settings | アプリケーション設定 |

## アーキテクチャ

```
┌─────────────────────────────────────────┐
│              SolidJS Frontend            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ │
│  │Pages │ │Store │ │ UI   │ │Locales │ │
│  └──┬───┘ └──┬───┘ └──────┘ └────────┘ │
│     │        │                          │
│     └────┬───┘                          │
│          │ Tauri Commands               │
├──────────┼──────────────────────────────┤
│          ▼       Rust Backend           │
│  ┌──────────┐  ┌──────────┐            │
│  │ Commands │  │ Services │            │
│  └────┬─────┘  └────┬─────┘            │
│       │              │                  │
│  ┌────▼──────────────▼─────┐           │
│  │    Infrastructure       │           │
│  │ ┌────────┐ ┌──────────┐ │           │
│  │ │API     │ │ Repos    │ │           │
│  │ │Clients │ │          │ │           │
│  │ └────────┘ └──────────┘ │           │
│  └─────────────────────────┘           │
└─────────────────────────────────────────┘
          │              │
          ▼              ▼
   ┌────────────┐  ┌──────────┐
   │Kabu Station│  │  VM API  │
   │ (証券API)  │  │          │
   └────────────┘  └──────────┘
```

## Tauri コマンド

### 認証
- `set_auth_token` / `get_auth_token` / `clear_auth_token`

### カブステーション連携
- `kabu_connect` — 接続確立
- `kabu_get_board` — 板情報取得
- `kabu_set_url` / `kabu_set_environment` — 接続設定

### スクリーニング
- `screen_stocks` — 銘柄スクリーニング実行

### ポジション
- `get_positions` — ポジション一覧
- `get_wallet_cash` — 現金残高

### 取引設定
- `list` / `get` / `create` / `update` / `delete` — CRUD 操作

### 取引執行
- `send_stock_buy` / `send_stock_sell` — 売買注文
- `cancel_order` — 注文取消
- `get_orders` — 注文一覧

### 暗号化
- `encrypt` / `decrypt` — キーチェーン（AES-GCM）

### 企業データ
- `search_companies` / `get_company`

## ストア（状態管理）

フロントエンドは SolidJS Store で状態を管理:

| ストア | 役割 |
|-------|------|
| `auth` | 認証・トークン管理 |
| `auto_trade` | 自動売買ライフサイクル |
| `kabu` | カブステーション接続 |
| `screening` | スクリーニングフィルター |
| `position` | ポートフォリオ |
| `trade_settings` | 取引戦略 |
| `trade_orders` | 注文管理 |
| `managed_positions` | マネージドポジション |
| `company` | 企業データキャッシュ |
| `keychain` | 資格情報ストレージ |
| `settings` | アプリ設定（テスト/本番） |

## ウィンドウ設定

- サイズ: 1200 × 900px（リサイズ可能）
- システムトレイ: 最小化時にトレイに格納
- トレイメニュー: 表示 / 終了

## ディレクトリ構成

```
src/                    フロントエンド（SolidJS）
├── pages/              ページコンポーネント
├── components/ui/      UI ライブラリ
├── store/              状態管理（12+ ストア）
├── lib/                ユーティリティ
└── locales/            i18n（日本語）

src-tauri/              バックエンド（Rust）
├── src/
│   ├── commands/       Tauri コマンドハンドラ（12+ モジュール）
│   ├── services/       ビジネスロジック
│   ├── domain/         ドメインモデル
│   ├── infrastructure/ API クライアント・DB・リポジトリ
│   ├── lib.rs          アプリセットアップ
│   └── main.rs         エントリーポイント
├── capabilities/       Tauri セキュリティ設定
└── icons/              アプリアイコン
```

## 関連ドキュメント

- [[api/overview]] — REST API
- [[user-console/overview]] — ユーザーコンソール
- [[admin-console/overview]] — 管理コンソール
- [[db/overview]] — データベース設計
