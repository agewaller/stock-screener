# DB スキーマ詳細（PostgreSQL）

ER 図 [`er.mmd`](er.mmd) に対応する各テーブルの詳細定義。Prisma の `schema.prisma` を書く際の正本となる論理仕様。

## 命名規約

- テーブル名: スネークケース複数形（`symptoms`, `ai_usage_logs`）
- カラム名: スネークケース
- PK: `id UUID DEFAULT gen_random_uuid()`
- FK: `<table_singular>_id UUID NOT NULL`
- タイムスタンプ: `TIMESTAMPTZ`（UTC で格納）
- ソフト削除: `deleted_at TIMESTAMPTZ NULL`
- 暗号化が必要なカラム: アプリ層で AES-GCM 暗号化（Secret Manager 鍵）して BYTEA 保存。本書では「暗号化対象」と注記
- `tenant_id`: 全ユーザーデータテーブルに含める。MVP では `users.id` と同じ値

## 共通カラム

すべてのユーザーデータテーブルは以下のカラムを持つ:

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id   UUID NOT NULL,
user_id     UUID NOT NULL REFERENCES users(id),
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at  TIMESTAMPTZ NULL
```

全テーブルに `(tenant_id, deleted_at)` の複合インデックス、ユーザー時系列クエリ用に `(user_id, recorded_at DESC)` 等を貼る。

---

## 1. 認証・ユーザー

### 1.1 `users`

ローカルユーザーレコード。Keycloak から `email` `display_name` を同期するが、source of truth は Keycloak。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | ローカル user_id |
| email | TEXT | NOT NULL, UNIQUE | Keycloak 同期、参照のみ |
| display_name | TEXT | | |
| is_anonymous | BOOLEAN | NOT NULL DEFAULT FALSE | 匿名ログインのフラグ |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | NULL | アカウント削除 |

### 1.2 `user_link`

Keycloak の `global_uid`（OIDC `sub`）と `users.id` を 1:1 紐付け。ADR-0002 で確定。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| global_uid | TEXT | NOT NULL, UNIQUE | Keycloak OIDC `sub` |
| user_id | UUID | NOT NULL, UNIQUE, FK → users | |
| linked_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

`global_uid` で検索する場合の唯一の入口。アプリ層は ID token から `sub` を取り出し、`user_link` 経由でローカル user_id に変換する。

### 1.3 `user_profiles`

ユーザーごとのプロファイル詳細（年齢・性別・既往薬等）。`users` と 1:1。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| user_id | UUID | PK, FK → users | |
| age | INTEGER | | |
| gender | TEXT | | |
| current_medications | BYTEA | | **暗号化対象** |
| allergies | BYTEA | | **暗号化対象** |
| selected_diseases | JSONB | | 65 疾患 ID の配列 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

### 1.4 `user_preferences`

UI 設定・選択モデル等。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| user_id | UUID | PK, FK → users | |
| locale | TEXT | NOT NULL DEFAULT 'ja' | ja/en/zh/ko/es/fr/pt/de/ar/it |
| selected_model | TEXT | | anthropic-opus-4-7 等の CONFIG id |
| feature_flags | JSONB | | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

### 1.5 `oauth_tokens`

Google Calendar / Fitbit 等の外部 OAuth トークン。Secret Manager に置くか DB に暗号化保管かの選択は実装時に決定。本書では DB 暗号化保管を仮定。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | NOT NULL, FK → users | |
| provider | TEXT | NOT NULL | `google_calendar`, `fitbit` 等 |
| encrypted_refresh_token | BYTEA | NOT NULL | **暗号化対象** |
| expires_at | TIMESTAMPTZ | | |
| scope | TEXT | | OAuth スコープ |
| updated_at | TIMESTAMPTZ | NOT NULL | |

UNIQUE `(user_id, provider)`。

---

## 2. 健康データ（9 カテゴリ）

すべて共通カラム（`id`, `tenant_id`, `user_id`, `created_at`, `updated_at`, `deleted_at`）を持つ。

### 2.1 `symptoms`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| recorded_at | TIMESTAMPTZ | NOT NULL | |
| condition_level | INTEGER | NOT NULL, CHECK 1-10 | |
| sleep_quality | INTEGER | CHECK 1-10 | |
| memo | TEXT | | |

### 2.2 `vitals`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| recorded_at | TIMESTAMPTZ | NOT NULL | |
| heart_rate | INTEGER | | bpm |
| blood_pressure | TEXT | | "120/80" 形式（パース可能） |
| temperature | DECIMAL(4,1) | | ℃ |
| spo2 | INTEGER | | % |

### 2.3 `blood_tests`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| test_date | DATE | NOT NULL | |
| wbc | DECIMAL | | |
| rbc | DECIMAL | | |
| hemoglobin | DECIMAL | | |
| crp | DECIMAL | | |
| extra_values | JSONB | | その他の検査項目 |

### 2.4 `medications`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| taken_at | TIMESTAMPTZ | NOT NULL | |
| name | TEXT | NOT NULL | |
| dosage | TEXT | | |

### 2.5 `meals`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| eaten_at | TIMESTAMPTZ | NOT NULL | |
| description | TEXT | | |

写真は `photos` テーブルで `photo_type = 'food'` として別管理。

### 2.6 `sleep_records`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| date | DATE | NOT NULL | 主に「いつの夜の睡眠」 |
| duration_hours | DECIMAL(4,2) | | |
| quality | INTEGER | CHECK 1-10 | |

### 2.7 `photos`

実体は Cloud Storage、DB はメタのみ。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| gcs_object_path | TEXT | NOT NULL | `gs://cares-prod-media/photos/{tenant}/{id}` |
| photo_type | TEXT | NOT NULL | `food/blood_test/prescription/supplement/other` |
| ai_classification | TEXT | | AI で自動分類された結果 |
| captured_at | TIMESTAMPTZ | NOT NULL | |

### 2.8 `activities`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| recorded_at | TIMESTAMPTZ | NOT NULL | |
| step_count | INTEGER | | |
| distance_km | DECIMAL(6,2) | | |
| active_minutes | INTEGER | | |
| source | TEXT | NOT NULL DEFAULT 'manual' | `manual/fitbit/apple_health` |

### 2.9 `moods`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| recorded_at | TIMESTAMPTZ | NOT NULL | |
| mood_level | INTEGER | NOT NULL CHECK 1-10 | |
| mood_tags | JSONB | | `["不安", "倦怠感", ...]` |
| memo | TEXT | | |

### 2.10 `text_entries`

自由記述メモ。健康関連のテキスト全般。**暗号化対象**（content）。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| recorded_at | TIMESTAMPTZ | NOT NULL | |
| content | BYTEA | NOT NULL | **暗号化対象** |

---

## 3. AI

### 3.1 `ai_conversations`

会話のコンテナ（タイトル・メタ）。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | |
| user_id | UUID | NOT NULL FK | |
| title | TEXT | | 自動生成 or ユーザー編集 |
| started_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| last_message_at | TIMESTAMPTZ | | クエリ最適化用 |
| deleted_at | TIMESTAMPTZ | | |

### 3.2 `ai_messages`

会話の各メッセージ。content は **暗号化対象**。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| conversation_id | UUID | NOT NULL FK | |
| role | TEXT | NOT NULL CHECK IN ('user', 'assistant', 'system') | |
| content | BYTEA | NOT NULL | **暗号化対象** |
| model_used | TEXT | | API レベルの model id |
| input_tokens | INTEGER | | |
| output_tokens | INTEGER | | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

### 3.3 `analyses`

日々の AI 解析 / 深堀 / タイムライン / 画像解析の結果。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| analysis_type | TEXT | NOT NULL | `daily/deep/timeline/image` |
| result | TEXT | NOT NULL | AI の返答 |
| model_used | TEXT | | |
| run_date | DATE | | JST 日付、`deep` の 1 日 1 回制約に使用 |

UNIQUE `(user_id, analysis_type, run_date) WHERE analysis_type = 'deep'`（部分インデックス）で「深堀解析は同日 1 回」を保証。

### 3.4 `doctor_reports`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| format | TEXT | NOT NULL | `carte/sns/relative` |
| content | TEXT | NOT NULL | |
| export_format | TEXT | | `pdf/json/fhir` |

### 3.5 `summaries`

3 受け手向け要約（医師 / SNS / 近親者）の保存版。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| audience | TEXT | NOT NULL CHECK IN ('doctor', 'sns', 'relative') | |
| content | TEXT | NOT NULL | |
| generated_at | TIMESTAMPTZ | NOT NULL | |

---

## 4. 連携

### 4.1 `inbox_messages`

Plaud 等のメール受信メッセージ。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| hash | TEXT | NOT NULL | djb2 ハッシュ（ユーザー識別） |
| user_id | UUID | FK | hash → user の解決後 |
| kind | TEXT | NOT NULL | `plaud/data` |
| raw_text | TEXT | NOT NULL | 200KB 上限 |
| processed | BOOLEAN | NOT NULL DEFAULT FALSE | |
| received_at | TIMESTAMPTZ | NOT NULL | |
| processed_at | TIMESTAMPTZ | | |

INDEX `(hash, processed)` で未処理メッセージを高速取得。

### 4.2 `calendar_events`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| source | TEXT | NOT NULL | `google_calendar/manual` |
| external_id | TEXT | | Google Calendar event_id |
| title | TEXT | NOT NULL | |
| start_at | TIMESTAMPTZ | NOT NULL | |
| end_at | TIMESTAMPTZ | | |

UNIQUE `(user_id, source, external_id) WHERE external_id IS NOT NULL`。

### 4.3 `cached_research`

PubMed クエリのキャッシュ。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| query_hash | TEXT | NOT NULL UNIQUE | クエリの正規化ハッシュ |
| query | TEXT | NOT NULL | 元クエリ |
| results | JSONB | NOT NULL | PubMed 結果 + AI 要約 |
| cached_at | TIMESTAMPTZ | NOT NULL | |
| expires_at | TIMESTAMPTZ | NOT NULL | TTL（7 日想定） |

---

## 5. 運用・監査

### 5.1 `audit_logs`

全データアクセスの監査。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| event_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| actor_type | TEXT | NOT NULL | `self/admin/system/integration` |
| actor_user_id | UUID | FK | 実行者 |
| action | TEXT | NOT NULL | `read/write/delete/export` |
| target_table | TEXT | NOT NULL | 対象テーブル |
| target_id | UUID | | 対象レコード |
| target_user_id | UUID | FK | 対象データの所有者 |
| details | JSONB | | クエリ条件、エクスポート範囲等 |
| visible_to_user | BOOLEAN | NOT NULL DEFAULT TRUE | ユーザー可視化対象 |

INDEX `(target_user_id, event_at DESC) WHERE visible_to_user = TRUE` で「自分にアクセスされた履歴」を高速取得。

### 5.2 `ai_usage_logs`

AI 呼び出しのトークン使用量・コスト記録。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | NOT NULL FK | |
| provider | TEXT | NOT NULL | `anthropic/openai/google` |
| model | TEXT | NOT NULL | API レベル model id |
| input_tokens | INTEGER | NOT NULL | |
| output_tokens | INTEGER | NOT NULL | |
| cost_jpy | DECIMAL(10,4) | NOT NULL | input + output の合計 |
| purpose | TEXT | | `daily_analysis/deep/chat/image/report/...` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

INDEX `(user_id, created_at DESC)`、月次集計用に `(user_id, date_trunc('month', created_at))` の partial index。

### 5.3 `drafts`

サーバ autosave。ブラウザに PII を残さない方針（ADR-0007）に対応。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | NOT NULL FK | |
| form_kind | TEXT | NOT NULL | `symptom/vital/text_entry/...` |
| payload | JSONB | NOT NULL | 入力中の値（**暗号化対象 = BYTEA に変更可**） |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| expires_at | TIMESTAMPTZ | NOT NULL | 提出完了 or 明示破棄まで |

UNIQUE `(user_id, form_kind)` でフォーム種別ごとに 1 ドラフト。

### 5.4 `prompts` / `prompt_versions`

管理者が編集できる AI プロンプトのバージョニング。

`prompts`:
| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| key | TEXT | PK | `default_prompt_daily/default_prompt_deep/...` |
| description | TEXT | | |
| current_version | TEXT | | |
| updated_at | TIMESTAMPTZ | | |

`prompt_versions`:
| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| prompt_key | TEXT | NOT NULL FK | |
| version | TEXT | NOT NULL | semver 風 |
| template | TEXT | NOT NULL | プロンプトテンプレート本体 |
| updated_by | TEXT | | 管理者 email |
| created_at | TIMESTAMPTZ | | |

UNIQUE `(prompt_key, version)`。

### 5.5 `ai_models`

利用可能な AI モデル一覧。**管理画面から動的に編集可能**（追加・廃止・有効/無効・並び順）。Anthropic / OpenAI / Google のモデル rotate に追従するため、コード変更なしで管理者が更新できる。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | TEXT | PK | 内部 ID（例: `claude-opus-4-7`） |
| display_name | TEXT | NOT NULL | UI 表示用（例: 「Claude Opus 4.7 (最強)」、ただし「AI」リテラルは含めない） |
| provider | TEXT | NOT NULL | `anthropic/openai/google` |
| api_model_id | TEXT | NOT NULL | API 呼び出し時の実 ID（例: `claude-opus-4-7-20260201`、datestamped 含む） |
| input_usd_per_1m | DECIMAL(10,4) | NOT NULL | 100 万トークン入力の USD コスト |
| output_usd_per_1m | DECIMAL(10,4) | NOT NULL | 100 万トークン出力の USD コスト |
| supports_streaming | BOOLEAN | NOT NULL DEFAULT TRUE | |
| supports_vision | BOOLEAN | NOT NULL DEFAULT FALSE | 画像入力対応 |
| is_enabled | BOOLEAN | NOT NULL DEFAULT TRUE | ユーザー選択 UI に出すか |
| is_default | BOOLEAN | NOT NULL DEFAULT FALSE | 1 件だけ TRUE |
| sort_order | INTEGER | NOT NULL DEFAULT 0 | UI 表示順 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

`MODEL_MAP` の役割をこのテーブルが担う。BE は `id` で参照し、API 呼び出し時に `api_model_id` を使う。`is_default = TRUE` の行はちょうど 1 件だけになるよう UNIQUE 部分インデックス。

### 5.6 `notifications_config`

管理者が「既存ユーザーへの移行通知」などの一斉通知を制御するための設定。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| campaign_key | TEXT | NOT NULL UNIQUE | 例: `migration_announce` |
| subject | TEXT | NOT NULL | |
| body | TEXT | NOT NULL | テンプレ |
| send_at | TIMESTAMPTZ | | 送信予定日時 |
| sent_at | TIMESTAMPTZ | | 実送信完了 |
| target_filter | JSONB | | 対象ユーザーの絞り込み条件 |
| created_at | TIMESTAMPTZ | | |
| created_by | TEXT | | 管理者 email |

### 5.7 `secret_status`

「鍵が設定済かどうか」のみを返す。**鍵値は絶対に DB に置かない**（旧仕様の `/admin/key-status` を継承）。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| secret_name | TEXT | PK | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, ... |
| is_set | BOOLEAN | NOT NULL | |
| last_updated_at | TIMESTAMPTZ | | |
| updated_by | TEXT | | |

実体の鍵は Secret Manager にのみ存在。このテーブルは UI 表示用のみ。

---

## 6. 共有（フェーズ 5 後半）

### 6.1 `shares`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| owner_user_id | UUID | NOT NULL FK | データの持ち主 |
| recipient_user_id | UUID | NOT NULL FK | 共有された相手 |
| role | TEXT | NOT NULL | `viewer/commenter` |
| scope | JSONB | NOT NULL | `{categories: [...], from: date, to: date}` |
| granted_at | TIMESTAMPTZ | NOT NULL | |
| expires_at | TIMESTAMPTZ | | NULL = 無期限 |
| revoked_at | TIMESTAMPTZ | | |

### 6.2 `share_invitations`

メール招待 → Magic Link でアカウント連携。

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | UUID | PK | |
| owner_user_id | UUID | NOT NULL FK | |
| recipient_email | TEXT | NOT NULL | |
| status | TEXT | NOT NULL | `pending/accepted/declined/expired` |
| token | TEXT | NOT NULL UNIQUE | Magic Link トークン |
| proposed_scope | JSONB | | |
| invited_at | TIMESTAMPTZ | NOT NULL | |
| expires_at | TIMESTAMPTZ | NOT NULL | 7 日想定 |

---

## 7. インデックス・パーティション戦略

### 主要インデックス

| テーブル | インデックス | 目的 |
|---|---|---|
| 全データテーブル | `(user_id, recorded_at DESC) WHERE deleted_at IS NULL` | タイムライン取得 |
| 全データテーブル | `(tenant_id, deleted_at)` | テナント分離検索 |
| `audit_logs` | `(target_user_id, event_at DESC) WHERE visible_to_user = TRUE` | 自分への監査ログ閲覧 |
| `ai_usage_logs` | `(user_id, date_trunc('month', created_at))` | 月次集計 |
| `inbox_messages` | `(hash, processed)` | 未処理メッセージ取得 |

### パーティション

MVP では不要。`ai_messages`, `audit_logs`, `ai_usage_logs` が大規模化したら月次パーティション（PostgreSQL ネイティブ）を検討。

### 暗号化カラム

以下のカラムはアプリ層で AES-GCM 暗号化（鍵は Secret Manager 経由）。

- `user_profiles.current_medications`
- `user_profiles.allergies`
- `text_entries.content`
- `ai_messages.content`
- `oauth_tokens.encrypted_refresh_token`
- `drafts.payload`（要検討、性能影響により plain JSONB の選択肢あり）

---

## 8. ハード削除（ガベージコレクション）

ソフト削除されたレコードは **30 日経過後にハード削除** する（ADR-0007 / 0012）。

実装案: Cloud Run Job として `apps/migration/gc.ts` を毎日実行。

```sql
DELETE FROM symptoms WHERE deleted_at < NOW() - INTERVAL '30 days';
-- 他テーブルも同様
```

物理削除前に `audit_logs` に「hard_delete by GC」を記録。Cloud Storage の photos も合わせて削除。

---

## 9. Prisma スキーマ化の注意

- `BYTEA` 列は Prisma で `Bytes` 型として扱う
- `JSONB` 列は `Json` 型
- `TIMESTAMPTZ` は `DateTime` 型
- 暗号化・復号化はアプリ層のラッパー層（`packages/db/encryption.ts` 想定）で透過的に実施
- ソフト削除は Prisma Middleware で `deleted_at IS NULL` をデフォルトクエリに付与

---

## 10. 未確定 / 将来検討

- pgvector エクステンションを使った embedding 列（RAG 用途）の追加検討
- 月次パーティション化のタイミング
- 暗号化鍵のローテーション戦略（半年に 1 回程度）
- マルチテナント本格運用時の Row Level Security（RLS）導入
