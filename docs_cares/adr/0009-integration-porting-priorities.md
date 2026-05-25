# ADR-0009: 外部連携の移植優先度

- Status: Accepted
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）

## Context

旧仕様には複数の外部連携機能がある（Google Calendar、Plaud、Fitbit、Apple Health、CSV、専門家メール送信）。新アーキテクチャへ全て一斉に移植するとフェーズ 5 が長期化する。優先順位を確定する必要がある。

## Decision

### MVP 必須

| 連携 | 旧仕様 | 新仕様での実装方針 |
|---|---|---|
| **Google Calendar / ICS** | `js/calendar.js` | BE で Google Calendar API を呼び、ユーザー OAuth トークンを暗号化保管。ICS 配信は BE のエンドポイント |
| **CSV エクスポート** | `js/integrations.js` | ADR-0007 のポータビリティ要件と統合。BE の `/api/export/csv` で配信 |
| **専門家メール送信** | `worker/professional-mailer.js` | SendGrid / Google Workspace Gmail API or Cloud Run + メール送信ライブラリへ移植 |
| **Plaud（音声録音 → メール取り込み）** | `worker/plaud-inbox.js` | **SendGrid Inbound Parse** で受信、Webhook で BE の `POST /api/integrations/inbox/plaud` を叩く。受信ドメイン `inbox.cares.advisers.jp` は継続使用（MX を SendGrid に向ける） |

### フェーズ 5 後半（MVP 後）

| 連携 | 用途 |
|---|---|
| **Fitbit** | ウェアラブル連携、OAuth + バイタル取り込み |
| **Apple Health** | iPhone データ取り込み |
| **CSV インポート** | 他アプリからの移行用 |

### 廃止

**なし**。すべての連携をいずれかの段階で実装する。

### 共通設計方針

- 各連携は `apps/api/src/integrations/{provider}.ts` のような **独立モジュール** として実装
- サービス未設定でも本体が動く（**フォールバック必須**、旧仕様の原則継続）
- OAuth トークン等は Secret Manager または `user_oauth_tokens` テーブルに暗号化保管
- ユーザー画面ではサービス名を直接出さず「カレンダー連携」「音声連携」等の一般名詞

## Consequences

### 良い面

- MVP リリースに必須機能を絞り込み、開発・テストを集中
- フォールバック設計により、連携障害がサービス全体に波及しない
- 段階的な機能追加が計画可能（リリース後の優先度調整が容易）

### 悪い面

- Fitbit / Apple Health ユーザーは MVP では便利機能を失う（旧仕様からの後退と感じる可能性）
- 「いつ移植されるか」がユーザーに不透明（ロードマップ公開でカバー）

### 派生タスク

- Plaud のメール取り込みの新アーキテクチャ設計（Cloudflare Email Worker からの移行）
- Google Calendar の OAuth リフレッシュトークン管理仕様（Secret Manager or DB）
- 「サービス名を出さない」UX ガイドラインの整備

## Alternatives Considered

- **すべて MVP に含める**: 開発期間が長期化、リリースが遅延。
- **MVP では連携ゼロ**: ユーザー価値の中核（カレンダー、専門家連携）を失う。
- **Plaud を MVP 後に**: 音声入力は高齢ユーザーへのユニーク価値。継続。
- **Apple Health を MVP 必須に**: iPhone ユーザーには価値高いが、Web 連携が重く（Apple Health は基本 iOS アプリ経由）、実装コスト過大。
