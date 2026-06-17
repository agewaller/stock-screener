# ER 図 / DB スキーマ（PostgreSQL）

新仕様 cares の Cloud SQL（PostgreSQL）論理データモデル。

| ファイル | 内容 |
|---|---|
| [er.md](er.md) | 主要テーブル間の関係（Mermaid erDiagram） |
| [schema.md](schema.md) | 各テーブルの詳細定義（カラム・制約・インデックス・備考） |

## 前提

- DB: Cloud SQL for PostgreSQL（asia-northeast1、Private IP）
- ORM: Prisma（`schema.prisma` が正本となる）
- 文字コード: UTF-8、TZ: UTC（アプリ層で JST 変換）
- PK: UUID v4（auto-increment は使わない、テナント分離・将来 sharding 対応）
- ソフト削除: 全ユーザーデータテーブルに `deleted_at TIMESTAMPTZ` を持たせる
- 物理削除: 30 日経過で別バッチが `DELETE` 実行（ハード削除）
- 監査: 全テーブル `created_at`, `updated_at` を持つ
- マルチテナント: 全ユーザーデータテーブルに `tenant_id UUID` を持たせる。MVP では `tenant_id = users.id`

## 関連 ADR

- [ADR-0001](../../adr/0001-rearchitecture-from-firebase-to-gcp.md): Firebase → PostgreSQL
- [ADR-0014](../../adr/0014-auth-switch-to-identity-platform.md): identity 主軸 `users.global_uid`（Firebase UID 直保管、user_link 廃止）
- [ADR-0007](../../adr/0007-browser-pii-prohibition.md): drafts テーブル（サーバ autosave）
- [ADR-0008](../../adr/0008-multi-tenant-ready-schema.md): tenant_id 設計

## カテゴリ別テーブル一覧

太字 = `schema.prisma` に実装済 (2026-06-01)。それ以外は設計のみ・未実装（[tables.md](../../detail-design/table/tables.md) 冒頭の実装状況を参照）。

| カテゴリ | テーブル群 |
|---|---|
| 認証・ユーザー | **`users`**, `user_profiles`, **`user_preferences`**, `oauth_tokens` |
| 健康データ（9 カテゴリ） | **`symptoms`**, **`vitals`**, **`blood_tests`**, **`medications`**, **`meals`**, **`sleep_records`**, **`photos`**, **`activities`**, **`moods`**, **`text_entries`** |
| AI | `ai_conversations`, `ai_messages`, **`analyses`**, **`doctor_reports`**, `summaries`（doctor_reports に統合） |
| 連携 | `inbox_messages`, `calendar_events`, `cached_research` |
| 運用・監査 | **`audit_logs`**, **`ai_usage_logs`**, `drafts`, **`prompts`**, **`prompt_versions`**, **`ai_models`**, **`notifications_config`**, `secret_status`（実装は **`secrets`**） |
| 共有（フェーズ 5 後半） | `shares`, `share_invitations` |
