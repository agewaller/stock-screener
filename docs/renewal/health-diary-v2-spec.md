# 健康日記（Health Diary）v2 — 完全リビルド仕様書

> エンジニア発注用 / そのまま実装に入れる詳細レベル / 漏れチェック済み

---

## 0. Context — なぜリビルドするか

現行の `cares.advisers.jp`（GitHub Pages + Vanilla JS + Firebase + 4 Workers）は機能が積み上がりすぎた結果、運用継続が困難になった。本書はゼロベースで作り直すための完全仕様書である。

### 0.1 現状の致命的問題（v1）

| # | 問題 | 根本原因 | v2 での解消方針 |
|---|---|---|---|
| 1 | **AI が動かない** | Cloudflare Worker 経由で Claude API を呼ぶ多段構成が不安定。`host_not_allowed`、`Load failed`、CORS、proxy URL 設定漏れ等が頻発。MODEL_MAP 不整合で 400 連発。 | API キーはサーバ側のみに保管、フロントから直接 Anthropic を叩かない。サーバが単一のリトライ・フォールバック窓口になる。モデル ID は DB の `ai_models` テーブルで一元管理。 |
| 2 | **ユーザーデータが消える** | Firestore の onSnapshot リスナーが初期空スナップショットでローカル履歴を上書きするバグ／`localStorage.clear()` の誤発火／`enableAutoSync` の race condition／schema migration 失敗。 | PostgreSQL に **append-only でサーバが真実の源**。クライアントは UI 状態のみキャッシュ。全 write は API 経由でトランザクション保証。論理削除（`deleted_at`）と日次バックアップで二重保護。 |
| 3 | **API キー・PII がコードに残る** | `js/config.js:14-23` に Firebase apiKey をハードコード、`AIza...` を pre-commit でブロックしているが Firestore Web API key の性質上完全排除できない。Anthropic キーは Worker secret に置いているが、ゲストモード設計が漏洩リスクを内包。 | 全ての secret はサーバの環境変数（`.env`、systemd / fly secrets / etc）のみ。フロントには **一切** API キーを露出しない。Firebase は廃止。 |
| 4 | **モバイル confirm/alert がブロックされる、popup OAuth が iOS で失敗** | ブラウザ仕様。 | confirm/alert は使わず全て in-UI モーダル。OAuth は **Authorization Code + PKCE** をサーバ側で処理（redirect ベース）。 |
| 5 | **多言語の DOM 走査翻訳が壊れる** | `i18n.js` が描画後に TreeWalker で日本語テキスト→キー逆引きしているため、UI 変更で壊れる。 | 全文字列を i18n キー化、React の `t(key)` 関数経由でしか描画しない。 |
| 6 | **コード密度が高くデバッグできない** | 13 ファイル / 数百関数を vanilla JS で抱える。型なし。テストなし。 | React + TypeScript で型安全化。コンポーネント単位の Storybook、API は OpenAPI スキーマ駆動、E2E は Playwright。 |

### 0.2 v2 の North Star

> 65 歳の慢性疾患当事者が、毎日 30 秒で記録でき、明日の打ち手が今日と違うと確信できる、堅牢で永続的なヘルスダイアリー。

### 0.3 非ゴール（やらない）

- ネイティブアプリ（iOS/Android）。PWA で済ませる。
- リアルタイムマルチユーザー（同期は本人の複数デバイス間のみ）。
- HIPAA / GDPR の完全準拠監査。要配慮個人情報として「ベストエフォート」で扱う。
- 医療機関向け B2B プラン。個人向け SaaS に絞る。
- 既存ユーザーデータの完全自動移行（後述「移行」参照、エクスポート JSON 経由のみ）。

---

## 1. 全体アーキテクチャ

```
┌──────────────────────────────────────────────────────────────┐
│ ブラウザ (React + TS + Vite, PWA)                              │
│  - 表示状態のみ Zustand。サーバ応答は TanStack Query でキャッシュ │
│  - service worker でオフライン参照のみ（書き込みは online only） │
└──────────────────────────────────────────────────────────────┘
                     │ HTTPS, Cookie (HttpOnly, Secure, SameSite=Lax)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ API サーバ (Node.js 22 + Fastify + TypeScript)                │
│  - REST + OpenAPI 3.1 で型生成                                 │
│  - JWT (access 15min) + Refresh Token (rotating, 30 day)      │
│  - Pino でロギング → stdout                                    │
│  - BullMQ で非同期ジョブ (PubMed, AI バッチ, メール)             │
└──────────────────────────────────────────────────────────────┘
                     │
   ┌─────────┬───────┴────────┬──────────────┐
   ▼         ▼                ▼              ▼
┌────────┐ ┌──────┐  ┌──────────────┐ ┌────────────┐
│ PG 16  │ │Redis │  │Object Storage│ │External APIs│
│primary │ │ 7    │  │ (S3 互換 / R2)│ │             │
│+ replica│ │      │  │ photos, PDF  │ │             │
└────────┘ └──────┘  └──────────────┘ └────────────┘
                                       ├ Anthropic
                                       ├ OpenAI
                                       ├ Google AI
                                       ├ Google OAuth (Auth + Calendar + Fit)
                                       ├ Fitbit OAuth
                                       ├ PubMed E-utilities
                                       ├ Resend (transactional email)
                                       └ Plaud Mail Webhook (Cloudflare Email Worker → POST /webhook)
```

### 1.1 デプロイメント

- **ホスティング**: Fly.io もしくは Cloudflare Containers + Hetzner VPS（東京リージョン）。最小 2 instance で auto-restart。
- **DB**: managed PostgreSQL 16（Supabase の DB のみ利用も選択肢、auth は使わない）or Neon。WAL アーカイブ → S3、PITR 7 日。
- **CDN**: Cloudflare（既存 cares.advisers.jp / ai.cares.advisers.jp を継続利用）。
- **CI/CD**: GitHub Actions。`main` push → test → build → migrate → blue/green deploy。
- **モニタリング**: Sentry + Uptime Robot + 自前 health endpoint `/healthz`。

### 1.2 リポジトリ構成

```
health-diary/
├── apps/
│   ├── web/                  # React + Vite (PWA)
│   ├── api/                  # Fastify + TypeScript
│   └── worker/               # BullMQ workers (PubMed fetch, AI batch, mail)
├── packages/
│   ├── shared/               # 型定義、共通 zod schema、i18n キー定義
│   ├── prompts/              # AI プロンプトテンプレート（コードと別管理、DB seed source）
│   └── disease-data/         # 疾患・処方軸・検査キット・補助制度の seed データ
├── infra/
│   ├── docker/
│   ├── migrations/           # node-pg-migrate or drizzle-kit
│   └── seed/
├── e2e/                      # Playwright
├── .github/workflows/
└── docs/
```

---

## 2. データモデル — PostgreSQL スキーマ

> 全テーブルに `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`、`created_at`、`updated_at`、`deleted_at NULL`（論理削除）を必ず持つ。タイムスタンプは `timestamptz`（UTC）。

### 2.1 認証・ユーザー

```sql
-- users
id uuid pk
email citext unique not null
email_verified_at timestamptz
password_hash text                  -- nullable (OAuth only user)
display_name text
photo_url text
locale text not null default 'ja'   -- ja, en, zh, ko, es, fr, de, pt, th, vi, ar, hi, it
role text not null default 'user'   -- user, admin
referral_source text
first_seen_at timestamptz
last_seen_at timestamptz
deleted_at timestamptz
created_at, updated_at

-- oauth_identities
id uuid pk
user_id uuid fk users(id) on delete cascade
provider text not null              -- 'google'
provider_uid text not null
email text
created_at
unique(provider, provider_uid)

-- refresh_tokens
id uuid pk
user_id uuid fk
token_hash text not null            -- SHA-256
issued_at timestamptz
expires_at timestamptz
revoked_at timestamptz
device_label text
ip inet
user_agent text

-- email_verification_tokens, password_reset_tokens (同上構造)
```

### 2.2 プロフィール・設定

```sql
-- user_profiles (1:1 with users)
user_id uuid pk fk users(id)
age int
gender text                         -- male, female, other
height_cm numeric(5,2)
weight_kg numeric(5,2)
location text                       -- 居住地（市区町村レベル）
travel_range_km int
notes text                          -- アレルギー・既往歴フリーテキスト
medical_history jsonb

-- user_diseases
id uuid pk
user_id uuid fk
disease_id text not null            -- references disease catalog (seed)
is_primary boolean default false
added_at timestamptz
custom_name text                    -- 'custom' の場合

-- user_settings (1:1)
user_id uuid pk
selected_model text default 'claude-opus-4-6'
custom_prompts jsonb                -- { promptKey: {body, schedule, enabled} }
affiliate_config jsonb
dashboard_layout jsonb
ui_preferences jsonb
privacy_anonymize_ai boolean default true   -- v2 はデフォルト ON
```

### 2.3 健康記録（コア）

> すべて `user_id` でパーティション可能な append-only テーブル。`recorded_at`（ユーザーが「いつのデータか」と申告する時刻）と `created_at`（DB に書かれた時刻）を分ける。

```sql
-- text_entries (フリーテキスト日記、Plaud, インテグレーション全般)
id uuid pk
user_id uuid fk
recorded_at timestamptz not null
category text not null              -- 'diary' | 'integration' | 'conversation' | 'voice_memo'
source text                         -- 'manual' | 'plaud' | 'apple_shortcut' | 'csv_import' | 'file_import'
type text                           -- 'plaud_transcript' | 'note' | ...
title text
content text not null
summary text
metadata jsonb
created_at, updated_at, deleted_at

-- symptoms
id, user_id, recorded_at
fatigue_level smallint              -- 1-10
pain_level smallint
brain_fog smallint
sleep_quality smallint
mood smallint
condition_level smallint            -- 総合 1-10 (Quick Input 用)
custom_metrics jsonb                -- 疾患別追加メトリクス (pem_frequency, phq9, etc)
note text
source text

-- vitals
id, user_id, recorded_at
heart_rate int
resting_heart_rate int
hrv_ms int
blood_pressure_systolic int
blood_pressure_diastolic int
temperature_c numeric(4,2)
spo2 numeric(5,2)
respiratory_rate int
weight_kg numeric(5,2)
body_fat_pct numeric(5,2)
source text, device text

-- sleep
id, user_id, recorded_at, end_at
duration_min int
deep_sleep_min int
rem_sleep_min int
light_sleep_min int
awakenings int
source text

-- activity
id, user_id, recorded_at, end_at
steps int
calories int
active_minutes int
stand_minutes int
distance_m int
exercise_minutes int
source text

-- nutrition_entries
id, user_id, recorded_at
meal_type text                       -- breakfast, lunch, dinner, snack
description text
calories int
protein_g numeric, carbs_g numeric, fat_g numeric
photo_id uuid fk photos(id)

-- medications
id, user_id, recorded_at
name text, dosage text, frequency text, route text
prescribed_by text
started_at date, ended_at date
status text                          -- active, paused, discontinued

-- supplements
（medications と同構造）

-- blood_tests
id, user_id, recorded_at
test_name text, value numeric, unit text, reference_range text
source text                          -- 'manual' | 'lab_pdf'
file_id uuid fk files(id)

-- photos
id, user_id, recorded_at
storage_key text not null            -- S3 / R2 object key
mime_type text
width int, height int
size_bytes bigint
description text
category text                        -- meal, test_result, skin, supplement_label, other
analyzed_at timestamptz

-- files
id, user_id
storage_key text, mime_type text, size_bytes bigint
purpose text                         -- 'lab_report' | 'csv_import' | 'apple_health_export'

-- wearable_imports (audit)
id, user_id, source, imported_at, period_start, period_end, record_count, raw_meta jsonb
```

### 2.4 AI 関連

```sql
-- ai_models (admin 編集可、フロントは GET のみ)
id text pk                           -- 'claude-opus-4-6'
display_name text
provider text                        -- 'anthropic' | 'openai' | 'google'
api_model_id text                    -- API に投げる実 ID（rotate 対応）
description text
default_for_user boolean default false
enabled boolean default true
cost_input_per_mtoken_usd numeric
cost_output_per_mtoken_usd numeric
sort_order int

-- prompts (DB 管理、admin で編集可、フロントは selectable 経由でのみ取得)
id uuid pk
key text unique not null             -- 'universal_daily', 'mecfs_daily', 'plaud_zen_track', ...
name text
description text
category text                        -- 'universal' | 'disease' | 'inline'
disease_id text                      -- nullable, references disease catalog
schedule text                        -- 'daily' | 'weekly' | 'on_data_update' | 'manual'
body text not null
is_active boolean default true
version int default 1
updated_by uuid fk users(id)
created_at, updated_at

-- prompt_history (バージョン履歴)
id, prompt_id, version, body, updated_by, updated_at

-- ai_analyses (AI 応答ログ)
id, user_id
prompt_id uuid fk prompts(id)
prompt_key text                      -- denormalized for query
model_id text
input_tokens int, output_tokens int
cost_jpy numeric(10,4)
duration_ms int
status text                          -- 'success' | 'refusal' | 'fallback' | 'error'
provider_path text                   -- 'anthropic→sonnet' fallback trace
raw_response text                    -- 長文。retention 90 日でアーカイブ
parsed jsonb                         -- {summary, findings, actions[], new_approach, next_check}
created_at

-- ai_recommendations (parsed.actions の正規化、重複排除用)
id, user_id, analysis_id
title text, body text
priority text                        -- high, medium, low
evidence_level text                  -- RCT, meta, case_report, n/a
action_type text                     -- clinic, supplement, device, lab, telemedicine, food, fitness, clinical_trial, manual
prescription_axis text               -- nutrition, body, mind, ... (14 axes)
proposed_at timestamptz
dismissed_at timestamptz
completed_at timestamptz

-- conversations
id, user_id
title text
created_at, updated_at

-- conversation_messages
id, conversation_id fk
role text                            -- 'user' | 'assistant' | 'system'
content text
metadata jsonb                       -- attached photo_id, prompt_key used, etc
created_at

-- api_usage (per-user, per-day rollup)
id, user_id, day date, model_id text
input_tokens bigint, output_tokens bigint, cost_jpy numeric(12,2)
request_count int
unique(user_id, day, model_id)
```

### 2.5 統合・外部サービス

```sql
-- integrations (per-user OAuth tokens & state)
id, user_id, provider                -- 'google_calendar' | 'google_fit' | 'fitbit' | 'apple_health' | 'plaud'
access_token_enc bytea               -- AES-256-GCM with KMS key
refresh_token_enc bytea
token_expires_at timestamptz
scope text
last_synced_at timestamptz
status text                          -- connected, disconnected, expired, error
error_message text
metadata jsonb                       -- provider-specific (e.g. fitbit user_id)
unique(user_id, provider)

-- calendar_events (cached from Google Calendar / ICS)
id, user_id
external_id text, calendar_id text, calendar_name text
title text, location text, description text
start_at timestamptz, end_at timestamptz
all_day boolean, attendees_count int
is_birthday boolean
source text                          -- 'google' | 'ics' | 'manual'
fetched_at timestamptz
unique(user_id, external_id)

-- plaud_inbox (受信した raw メール、Worker → API webhook 経由)
id, user_id_hash text                -- 8-char digest（互換性のため）
user_id uuid                         -- resolved
kind text                            -- 'plaud' | 'data'
from_address text, subject text, raw_text text
received_at timestamptz
processed_at timestamptz
analysis_id uuid fk ai_analyses(id)
error text
```

### 2.6 専門家・補助制度

```sql
-- professionals (admin 登録、admin/config 相当)
id uuid pk
name text, specialization text       -- 'social_worker' | 'lawyer' | 'tax_accountant' | 'fp' | 'doctor' | 'counselor'
email text, phone text, url text
region text
profile text
is_active boolean default true
sort_order int

-- support_programs (補助制度カタログ。seed)
id text pk                           -- 'jiritsu_shien', 'nanbyou_jyosei', ...
name text, category text             -- medical | income | identity | tax | work | housing | welfare | care | local
description text
target_diseases text[]
professional_type text                -- which specialist handles
amount_text text
form_schema jsonb                    -- which fields to ask (FINANCIAL_SUPPORT_FIELDS)

-- support_applications (per-user 申請)
id, user_id, program_id
status text                          -- draft, submitted, approved, denied
form_data jsonb
submitted_at, professional_id fk, sent_email_id
created_at, updated_at
```

### 2.7 商品・アフィリエイト

```sql
-- products
id, name, description, icon, color
evidence_level, cost_range
disease_ids text[], prescription_axis text
is_active boolean
sort_order int

-- product_links
id, product_id fk
store_id text                        -- 'amazon_jp' | 'rakuten' | 'iherb' | 'a8' | 'custom'
url text, sku text, asin text
price_text text

-- affiliate_clicks
id, user_id (nullable), product_id, store_id
clicked_at timestamptz
referrer text, user_agent text, ip inet

-- affiliate_conversions (postback)
id, user_id, product_id, store_id
order_id text, amount numeric, currency text
converted_at
```

### 2.8 運用・監査

```sql
-- audit_logs
id, actor_user_id, action, target_type, target_id
metadata jsonb, ip inet, user_agent text, created_at

-- safety_events (AI 拒否、prompt injection 試行等)
id, user_id, event_type, severity, details jsonb, created_at

-- backups (週次スナップショットメタデータ)
id, user_id, snapshot_date, storage_key, size_bytes, created_at
```

### 2.9 RLS と暗号化

- PostgreSQL の **Row Level Security は使わない**（API が唯一の入口）。代わりに API レイヤで必ず `user_id = req.auth.user_id` を where 句に。テストでカバー。
- `oauth_identities.refresh_token_enc`、`integrations.access_token_enc` 等は **AES-256-GCM**（key = `ENCRYPTION_KEY` 環境変数、定期 rotate 可能なよう key version 付き）。
- `password_hash` は **Argon2id**（memory=64MB, iterations=3, parallelism=4）。
- パスワードリセット・メール確認トークンは crypto random 32 bytes、DB には SHA-256 のみ保存。
- DB at-rest 暗号化はマネージドサービスのデフォルトに任せる。

---

## 3. REST API 仕様

> 全エンドポイント `/api/v1` プレフィックス。OpenAPI 3.1 で `packages/shared/openapi.yaml` に定義し、クライアント型生成。

### 3.1 認証

| Method | Path | 用途 |
|---|---|---|
| POST | `/auth/signup` | email/password 登録。確認メール送信。|
| POST | `/auth/verify-email` | トークン検証 → email_verified_at |
| POST | `/auth/login` | email/password → access + refresh cookie |
| POST | `/auth/refresh` | refresh token rotation |
| POST | `/auth/logout` | refresh revoke + cookie clear |
| POST | `/auth/password-reset/request` | メール送信 |
| POST | `/auth/password-reset/confirm` | 新パスワード保存 |
| GET | `/auth/google/start` | OAuth state を session に保存し redirect |
| GET | `/auth/google/callback` | code → token 交換、users upsert、cookie 発行 |
| GET | `/auth/me` | 現在のユーザー情報 |

- access token: `Set-Cookie: hd_access=...; HttpOnly; Secure; SameSite=Lax; Max-Age=900`
- refresh token: `Set-Cookie: hd_refresh=...; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=2592000`
- CSRF: SameSite=Lax + state-changing requests に `X-CSRF-Token`（double-submit cookie）

### 3.2 ユーザー / プロフィール

| Method | Path |
|---|---|
| GET, PATCH | `/me/profile` |
| GET, PUT | `/me/diseases` |
| GET, PATCH | `/me/settings` |
| DELETE | `/me` （アカウント完全削除、論理削除 + 30 日後 hard delete ジョブ） |
| GET | `/me/export` （全データを JSON で zip 配信、署名付き URL） |

### 3.3 健康記録

すべて `GET /api/v1/{resource}?from=&to=&limit=&cursor=`、`POST /api/v1/{resource}`、`PATCH /api/v1/{resource}/{id}`、`DELETE`（論理削除）。リソース：

- `text-entries`, `symptoms`, `vitals`, `sleep`, `activity`, `nutrition`, `medications`, `supplements`, `blood-tests`, `photos`

特殊：
- `POST /quick-input` — 自由文 + 任意写真。サーバ側で `symptoms` への分解と `text_entries` 同時作成、`ai_analyses` を非同期 enqueue。
- `POST /photos/upload-url` — pre-signed PUT URL を返す。クライアントが S3 互換ストレージに直接 PUT。
- `GET /timeline?from=&to=` — 全カテゴリ統合タイムライン。

### 3.4 AI

| Method | Path | 用途 |
|---|---|---|
| GET | `/ai/models` | 有効モデル一覧 |
| GET | `/ai/prompts` | 自分が選択可能なプロンプト一覧（疾患フィルタ済み） |
| POST | `/ai/analyze` | body: `{ promptKey, modelId?, attachments? }` → 同期で 60s タイムアウト or `async=true` で job_id |
| GET | `/ai/jobs/:id` | 非同期ジョブ結果 |
| POST | `/ai/chat/:conversationId/messages` | 会話に user message を追加 → assistant 応答返却 |
| GET | `/ai/analyses` | 分析履歴一覧 |
| GET | `/ai/analyses/:id` | 詳細 |
| GET | `/ai/recommendations` | アクションアイテム一覧（active のみ） |
| POST | `/ai/recommendations/:id/dismiss` | 棄却 |
| POST | `/ai/recommendations/:id/complete` | 完了 |

#### 3.4.1 `/ai/analyze` のサーバ処理フロー

1. user_id 取得、設定モデル取得
2. プロンプト DB から取得 → `interpolatePrompt` でプレースホルダ展開
3. EPIDEMIOLOGY_CONTEXT、PRESCRIPTION_PROTOCOL、RECENT_PROPOSALS をサーバ側で構築（クライアントに見せない）
4. PII マスキング（`privacy_anonymize_ai = true` のとき）
5. プロバイダ呼び出し（リトライ・フォールバック含む。下記 8 章）
6. 拒否検出 → 検出時は `_gracefulRefusalFallback` 相当を返却
7. `ai_analyses` に保存、parsed の `actions[]` を `ai_recommendations` に正規化
8. `api_usage` を rollup
9. クライアントに結果返却

### 3.5 統合

| Method | Path |
|---|---|
| GET | `/integrations` 一覧 |
| POST | `/integrations/google-calendar/connect` （OAuth start） |
| GET | `/integrations/google-calendar/callback` |
| POST | `/integrations/google-calendar/import` body: `{ icsUrl? }` |
| GET | `/integrations/google-calendar/events?from=&to=` |
| POST | `/integrations/fitbit/connect` |
| GET | `/integrations/fitbit/callback` |
| POST | `/integrations/fitbit/sync` body: `{ days? }` |
| POST | `/integrations/google-fit/connect` |
| POST | `/integrations/google-fit/sync` |
| POST | `/integrations/apple-health/import` (multipart, XML) |
| GET | `/integrations/plaud/email-address` （ユーザー固有メアド） |
| GET | `/integrations/plaud/inbox` |
| POST | `/integrations/import/csv` |
| POST | `/integrations/import/json` |
| POST | `/integrations/auto-sync/run` （手動トリガ） |
| GET | `/integrations/auto-sync/status` |

### 3.6 PubMed・研究

| Method | Path |
|---|---|
| GET | `/research/search?q=&days=&max=` |
| GET | `/research/cached/:diseaseId` （Worker が定期更新したキャッシュ） |

### 3.7 補助制度・専門家

| Method | Path |
|---|---|
| GET | `/support/programs` |
| GET | `/support/programs/:id` |
| POST | `/support/applications` （新規申請） |
| PATCH | `/support/applications/:id` |
| POST | `/support/applications/:id/submit` （専門家へメール送信） |
| GET | `/professionals?specialization=&region=` |

### 3.8 商品・アフィリエイト

| Method | Path |
|---|---|
| GET | `/products?diseaseId=&axis=` |
| POST | `/affiliate/click` （リンククリック発火、tracking pixel もあり） |
| POST | `/affiliate/conversion` （postback、署名検証） |

### 3.9 ゲストモード

- `POST /guest/analyze` — 認証なし。レート制限：IP 当たり 10 req / 24h、入力は 4000 字まで。サーバ側で固定 `fast_guest_summary` プロンプト + `claude-haiku-4-5` 強制。ログは `ai_analyses` に `user_id=NULL, guest_ip_hash=` で記録。
- `POST /guest/doctor-report-sample` — `GUEST_REPORT_DATA` から疾患別架空 30 日データを返す。

### 3.10 管理 API（role=admin のみ）

| Method | Path |
|---|---|
| GET | `/admin/users?cursor=&search=` （メール・最終アクセス・記録数のみ。本文は返さない） |
| GET | `/admin/usage` |
| GET, POST, PATCH, DELETE | `/admin/prompts` |
| GET, PATCH | `/admin/ai-models` |
| GET, POST | `/admin/professionals` |
| GET, POST | `/admin/products` |
| GET | `/admin/safety-events` |
| GET | `/admin/audit-logs` |
| POST | `/admin/backups/restore` body: `{ userId, snapshotDate }` |
| POST | `/admin/duplicates/dedupe` body: `{ userId }` |
| GET | `/admin/disease-priority` （事業優先度マトリクス用） |

### 3.11 共通仕様

- **エラーフォーマット** `{ error: { code, message, details? } }`
- **レート制限**: 認証ルート 5 req/min/IP、AI 系 30 req/hour/user、その他 60 req/min/user。Redis token bucket。
- **冪等性**: POST `/photos/upload-url`、`/ai/analyze` などは `Idempotency-Key` ヘッダ対応。
- **ページネーション**: cursor ベース（`?cursor=base64(id+created_at)`）。
- **タイムスタンプ**: 全て ISO 8601 UTC。
- **OpenAPI**: `/api/v1/openapi.json` で取得可、`/docs` に Swagger UI（dev 環境のみ）。

---

## 4. 認証・認可詳細

### 4.1 サインアップ・ログイン

- email/password: Argon2id。最小 8 文字、辞書チェック（pwned password の k-anonymity API 経由）。
- email verification: 必須。未確認ユーザーは AI 機能を使えない（読み取りのみ可）。
- ログイン失敗: 1 アカウントあたり 5 連続失敗で 15 分ロック、IP ベースで bursty も別途。
- Google OAuth: Authorization Code + PKCE。`state` を session cookie に保管。redirect_uri は `https://cares.advisers.jp/auth/google/callback` 固定。

### 4.2 JWT

- access token: HS256（共有 secret は env、ローテーション可）、payload `{ sub, role, iat, exp, jti }`。15 分。
- refresh token: opaque（DB に SHA-256 保存）。30 日 sliding。発行時に旧 token を revoke（rotation）。盗難検知：revoked token の再利用 → 全 refresh token 強制 logout。

### 4.3 認可

- API 全エンドポイントで `user_id = jwt.sub` を WHERE に付ける（フレームワークの hook で強制）。
- admin role: DB の `users.role = 'admin'`。admin エンドポイントは middleware で role check。
- `agewaller@gmail.com` のハードコードは廃止。初期 admin は seed + 環境変数 `INITIAL_ADMIN_EMAIL`。

### 4.4 セッション管理

- ユーザーは複数デバイスで並行ログイン可（refresh_tokens 複数行）。
- 設定画面に「ログイン中のセッション」一覧と個別 revoke。

---

## 5. フロントエンド設計

### 5.1 ルーティング（React Router v7）

```
/                                   → ランディング（未ログイン）/ Home（ログイン済み）
/login
/signup
/auth/google/callback               → API へ即 redirect
/auth/verify?token=
/auth/reset?token=

/app/home                           → Dashboard
/app/record                         → Data Input
/app/record/quick                   → Quick Input（モーダル展開）
/app/timeline
/app/actions                        → Recommendations
/app/research
/app/chat
/app/chat/:conversationId
/app/integrations
/app/integrations/:provider
/app/support                        → 補助制度ガイド
/app/support/:programId
/app/settings
/app/settings/profile
/app/settings/diseases
/app/settings/privacy
/app/settings/data
/app/settings/sessions

/admin                              → role=admin のみ
/admin/users
/admin/prompts
/admin/ai-models
/admin/professionals
/admin/products
/admin/usage
/admin/disease-priority
/admin/audit
/admin/safety

/legal/privacy
/legal/terms
/legal/disclaimer
/legal/contact
```

### 5.2 状態管理

- **TanStack Query** — サーバ状態（全リクエスト）。staleTime をリソースごとに調整。
- **Zustand** — クライアント状態のみ（UI モーダル開閉、選択中のフィルタ、未送信下書き）。
- **react-hook-form + zod** — フォームバリデーション。
- **i18next** — 多言語。
- **service worker** — 読み取りキャッシュのみ。書き込みは必ずオンライン要件。

### 5.3 デザインシステム

- CSS variables ベース（既存と同じ light theme 固定）：
  ```
  --bg-primary: #f8f9fc, --bg-secondary: #ffffff, --bg-tertiary: #f3f4f8
  --border: #e4e7ef
  --accent: #6C63FF
  --text-primary: #1e293b, --text-secondary: #64748b, --text-muted: #94a3b8
  --success: #10b981, --warning: #f59e0b, --danger: #ef4444
  --radius: 12px
  ```
- フォント: `Inter` + `Noto Sans JP`。`JetBrains Mono` for code.
- **ダークテーマは追加しない**（CLAUDE.md の鉄則を継承）。
- 主要コンポーネント（packages/shared/ui で実装）:
  - `Button` (primary, secondary, ghost, danger)
  - `Card`, `Modal`, `Sheet` (mobile bottom sheet)
  - `Toast`（confirm/alert 完全代替。`useToast()` hook）
  - `Dialog`（confirm 代替。promise-based: `await dialog.confirm({ title, body, danger })`）
  - `HealthGauge` (SVG 0-100)
  - `SeverityBar`
  - `MetricCard`
  - `RecommendationCard`
  - `ResearchCard`（PubMed 結果。translate.goog サブドメイン形式の翻訳リンク必須）
  - `ChatMessage`, `TypingIndicator`
  - `EmptyState`
  - `FormField`, `Slider`, `NumberField`, `BloodPressureField`
  - `PhotoUpload`（drag&drop、自動圧縮 maxDim=1600, quality=0.85）
- すべて `aria-*` 属性、キーボードナビゲーション対応。

### 5.4 PWA

- `manifest.json`:
  ```json
  {
    "name": "健康日記",
    "short_name": "健康日記",
    "description": "慢性疾患患者のための体調記録・情報整理ツール",
    "start_url": "/app/home",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#6C63FF",
    "orientation": "portrait-primary",
    "icons": [
      { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
- Service Worker (Workbox)：ハッシュ付きアセットを stale-while-revalidate、API は network-only。
- アプリ内ブラウザ（LINE / Instagram）検出 → Safari/Chrome 誘導バナー。

### 5.5 印刷スタイル（医師提出レポート）

- A4 1 枚に収まる印刷用 `@media print` スタイル。
- 「医師提出レポート」ボタン → 専用ルート `/app/print/doctor-report?range=30d` → `window.print()` トリガ。

### 5.6 アクセシビリティ・ペルソナ

ターゲット = 65 歳女性。

- 最小フォント 16px、本文 18px。
- タップ領域 48×48px 以上。
- ボタンに必ずテキスト（アイコンのみ禁止）。
- 「AI」「LLM」等の専門用語をユーザー UI に出さない（管理画面のみ可）。
- 医学用語にひらがなルビ or 併記（例：「脳霧（ブレインフォグ）」）。
- 確認ダイアログは「〇〇してもよろしいですか？」の敬語。
- 励まし文言を空状態・エラー時にも入れる。

---

## 6. 全 UI 文言（i18n キー）

> 既存 `js/i18n.js` の全キーを継承。React 側は `t('app_name')` で参照。**全画面の文字列を一括ここで管理**。

### 6.1 サポート言語

`ja`（デフォルト）, `en`, `zh`, `ko`, `es`, `fr`, `de`, `pt`, `th`, `vi`, `ar`, `hi`, `it`（13 言語）。  
初期実装は `ja` + `en` のみフル翻訳、他は機械翻訳で seed → 順次手直し。

### 6.2 主要 i18n キー（抜粋、全件は `packages/shared/i18n/ja.json` に格納）

| キー | ja | 用途 |
|---|---|---|
| `app_name` | 健康日記 | アプリ名 |
| `app_subtitle` | 〜慢性疾患の寛解をサポート〜 | サブタイトル |
| `nav.home` | ホーム | ナビ |
| `nav.record` | 記録する | ナビ |
| `nav.actions` | アクション | ナビ |
| `nav.research` | 最新研究 | ナビ |
| `nav.chat` | 相談する | ナビ |
| `nav.integrations` | 連携 | ナビ |
| `nav.settings` | 設定 | ナビ |
| `nav.admin` | 管理パネル | ナビ |
| `quick_input.placeholder` | 今日の体調は？（例：頭痛がする、生理2日目で辛い、昨日よく眠れた...） | テキストエリア |
| `quick_input.send` | 送信 | ボタン |
| `quick_input.advice` | アドバイス | セクション |
| `quick_input.your_recommendations` | あなたへの推奨 | セクション |
| `metrics.fatigue` | 疲労度 | メトリック |
| `metrics.pain` | 痛み | |
| `metrics.brain_fog` | 脳霧（ブレインフォグ） | |
| `metrics.sleep` | 睡眠 | |
| `metrics.mood` | 気分 | |
| `profile.age` | 年齢 | |
| `profile.gender` | 性別 | |
| `profile.gender.male` | 男性 | |
| `profile.gender.female` | 女性 | |
| `profile.gender.other` | その他 | |
| `profile.height` | 身長 | |
| `profile.weight` | 体重 | |
| `profile.location` | 居住地 | |
| `profile.language` | 言語 | |
| `profile.save` | プロフィールを保存 | |
| `auth.login_with_google` | Googleアカウントではじめる | |
| `auth.login_with_email` | メールアドレスではじめる（無料） | |
| `auth.email` | メールアドレス | |
| `auth.password` | パスワード | |
| `auth.login` | ログイン | |
| `auth.signup` | 無料で登録する | |
| `auth.logout` | ログアウト | |
| `auth.first_time_hint` | 初回は自動で登録されます。2回目以降は同じメール・パスワードでログイン。 | |
| `auth.welcome_back` | おかえりなさい。ログインしました | toast |
| `auth.signup_success` | アカウントを作成しました。ようこそ！ | toast |
| `auth.wrong_password` | パスワードが違います。もう一度お試しください | toast |
| `auth.email_in_use` | このメールアドレスは登録済みです。パスワードをご確認ください | toast |
| `auth.weak_password` | パスワードは8文字以上で設定してください | toast |
| `auth.invalid_email` | メールアドレスの形式が正しくありません | toast |
| `auth.popup_blocked` | ポップアップがブロックされました。メールアドレスでの登録をお試しください。 | toast |
| `auth.too_many_attempts` | しばらく時間をおいてからお試しください | toast |
| `disease.select_title` | 対象疾患を選択（任意・後から変更可） | |
| `disease.search_placeholder` | 疾患名で検索... | |
| `disease.selected_count` | {count}件選択中 | |
| `guest.try_now` | まずはお試しください（登録不要） | |
| `guest.try_input_hint` | 今の体調や気になること、お薬の写真などを入れてみてください | |
| `guest.ask_button` | 聞いてみる | |
| `guest.photo` | 写真 | |
| `guest.sample_record` | サンプル記録で試してみる | |
| `guest.doctor_report_sample` | 医師提出レポートのサンプルを見る | |
| `features.title` | このサービスでできること | |
| `features.record` | 体調を記録 — テキスト・写真・ファイルで日々の症状、服薬、食事、気分を記録 | |
| `features.visualize` | 経過を可視化 — 記録データの時系列表示と傾向の整理 | |
| `features.research` | 研究情報の収集 — 最新の研究情報を疾患別に自動取得（参考情報） | |
| `features.assist` | 情報の整理補助 — 入力内容に基づく参考情報の提示（医療行為ではありません） | |
| `disclaimer` | ※本情報は参考情報です。健康上の判断は必ず医師にご相談ください。 | |
| `inapp_warning.title` | ⚠ アプリ内ブラウザでは Google ログインが使えません | |
| `inapp_warning.line_button` | Safari/Chrome で開く（LINE 専用） | |
| `inapp_warning.share_to_safari` | 📤 共有メニューから Safari で開く | |
| `loading` | 読み込み中... | |
| `analyzing` | 分析中... | |
| `saved` | 保存しました | toast |
| `deleted` | 削除しました | toast |
| `error.network` | ネットワークエラーが発生しました。再試行してください。 | |
| `error.session_expired` | セッションが切れました。再ログインしてください。 | |
| `error.ai_busy` | 現在AIサービスが混雑しています。しばらくしてから再度お試しください。 | |
| `error.ai_timeout` | 分析に時間がかかっています。写真分析は特に時間が必要です。もう一度お試しください。 | |
| `confirm.delete_account` | アカウントを完全に削除します。すべての記録・分析履歴が消えます。本当によろしいですか？ | |
| `confirm.delete_entry` | この記録を削除してもよろしいですか？ | |
| `confirm.disconnect_integration` | {provider}との連携を解除してもよろしいですか？ | |
| `data.export_all` | すべてのデータをエクスポート | |
| `data.import` | データインポート | |
| `data.delete_account` | アカウントを完全削除（退会） | |
| `privacy.banner_title` | 🔒 あなたの記録は、あなたのものです | |
| `privacy.banner_body` | AI 学習には使われません ・ いつでも完全削除可能 ・ プライバシーマーク取得準備中 | |
| `legal.privacy_safety` | プライバシーと安全 | |
| `legal.privacy_policy` | プライバシーポリシー | |
| `legal.terms` | 利用規約 | |
| `legal.disclaimer` | 免責事項 | |
| `legal.contact` | お問い合わせ | |
| `footer.company` | 運営: シェアーズ株式会社 | |
| `footer.made_in_japan` | 🇯🇵 Made in Japan | |
| `footer.service_disclaimer` | 本サービスは医療機器ではありません ・ 無料 | |
| `empty.no_records` | まだ記録がありません。今の体調をお聞きするか、連携サービスからデータを取り込むことができます。 | |
| `empty.no_calendar` | カレンダーデータがありません。連携ページからGoogleカレンダーを同期してください。 | |
| `empty.no_recommendations` | まだ推奨アクションがありません。記録を続けると、AIがあなたに合った提案をお届けします。 | |

> **完全なキーリスト**は既存 `js/i18n.js` を seed として `packages/shared/i18n/{lang}.json` に展開する。新規追加キー（モーダル、サポート申請フォーム、admin 等）は `docs/i18n-additions.md` で管理。**「AI」リテラルをユーザー向け UI に混ぜない**ルールを継承（lint で検出）。

### 6.3 AI 応答の定型フォールバック文言

`error.ai_busy` 時にサーバが返す JSON は以下を `summary` / `findings` / `actions` にセット：

```json
{
  "summary": "記録ありがとうございます。お疲れさまです。",
  "findings": "現在AIサービスが混雑しています。しばらくしてから再度お試しください。\n\n日々の記録を続けていただくことが、ご自身の体調パターンを理解する第一歩です。",
  "actions": [
    "今日の記録を続けていただきありがとうございます。",
    "気になる症状があれば、次の診察時にこの日記を見せて主治医にご相談ください。"
  ],
  "new_approach": "体調が安定している時間帯を記録すると、活動のペース配分が見えてきます。",
  "next_check": "明日も一行で大丈夫ですので書いてみてください。",
  "_fallback": "server_minimal"
}
```

### 6.4 メール本文テンプレート

専門家へのメール送信フッター（`worker/professional-mailer.js` を継承）：

```
---
このメールは「健康日記 (cares.advisers.jp)」の申請サポート機能から送信されています。
制度: {programName}
申請ID: {applicationId}
返信はそのまま {replyTo} に届きます。
```

その他のメールテンプレート：
- `auth/verify-email.tmpl`: メール確認
- `auth/password-reset.tmpl`: パスワードリセット
- `auth/welcome.tmpl`: 登録完了
- `notifications/weekly-summary.tmpl`: 週次サマリー（オプトイン）

---

## 7. AI エンジンとプロンプト管理

### 7.1 サポートモデル（seed: `ai_models`）

| id | display_name | provider | api_model_id | default | desc |
|---|---|---|---|---|---|
| `claude-opus-4-6` | Claude Opus 4.6 | anthropic | claude-opus-4-6 | ❌ | 最高精度（30-60秒） |
| `claude-sonnet-4-6` | Claude Sonnet 4.6 | anthropic | claude-sonnet-4-6 | ✅ | 高速・高精度（10-20秒） |
| `claude-haiku-4-5` | Claude Haiku 4.5 | anthropic | claude-haiku-4-5 | ❌ | 最速・低コスト（3-8秒） |
| `gpt-4o` | GPT-4o | openai | gpt-4o | ❌ | OpenAI マルチモーダル |
| `gemini-2.5-pro` | Gemini 2.5 Pro | google | gemini-2.5-pro | ❌ | Google 最新 |

**重要**: `claude-3-5-sonnet-20241022` 等の **datestamped ID をハードコードしない**。常に `api_model_id` 経由。

### 7.2 プロンプト管理

- DB の `prompts` テーブルが正。初期 seed は `packages/prompts/seed/*.md`（既存 `js/prompts.js` の全 168+ 個を YAML front matter 付き Markdown 化）。
- admin UI で編集可。編集は `prompt_history` にバージョン記録。
- フロントは `/ai/prompts` で選択肢のみ取得。プロンプト本文は **クライアントに送らない**。
- インライン用プロンプト（image_analysis_food_photo 等）はクライアントから `promptKey` 指定だけで叩く。

### 7.3 共通ヘッダ（PROMPT_HEADER）

サーバ側で全プロンプトに自動付与（既存 `js/prompts.js:62-561` を継承）。主要要素：

1. **タスクの種類** — 教育的情報提供 + 日記整理。診断・処方はしない。
2. **AI の役割** — 慢性疾患当事者向け educational health information companion。役割は 4 点に限定：日記整理 / 時系列可視化 / 公開情報要約 / 主治医相談の準備。
3. **情報源** — 医学教科書、PubMed 査読論文、公的機関情報、製品ラベル。新たな診断・処方ではなく、公開情報の整理。
4. **前提** — ユーザーは主治医診療中の成人。提供は参考情報。最終判断はユーザーと主治医。
5. **応答必須要件**
   - 必ず役立つ一般情報を提供（「医師に相談を」で終わらせない）
   - 公開情報レベルなら医療トピックでも遠慮なく共有
   - 温かく寄り添い、希望を添える
6. **応答言語ディレクティブ** — `_languageDirectiveFor(userLang)` を 13 言語分実装（既存 `js/ai-engine.js:78-92` を継承）
7. **毎回必須の 3 要素** — (1) 寄り添いと共感を最初に / (2) 励ましと希望の言葉を 1 つ / (3) **SOMETHING NEW**（今日の新処方）
8. **本日の新処方プロトコル** — 14 軸（PRESCRIPTION_AXES）を `dayOfYear % 14` でローテーション、過去 14 日の提案リストから除外、「╔══ 今日の新処方 ══」ブロック形式で出力
9. **疫学コンテキスト** — 選択疾患の世界・日本患者数を会話に自然に織り込む

### 7.4 プロンプト補間プレースホルダ

| プレースホルダ | 説明 |
|---|---|
| `{{RESPOND_LANGUAGE_INSTRUCTION}}` | 言語ディレクティブ |
| `{{USER_LANGUAGE}}` | ISO 639-1 |
| `{{DATE}}` | ロケール別フォーマット |
| `{{USER_PROFILE}}` | プロフィール（年齢・性別・身長・体重・居住地・通院範囲） |
| `{{SELECTED_DISEASES}}` | 選択疾患名 |
| `{{EPIDEMIOLOGY_CONTEXT}}` | 患者数参考情報 |
| `{{PRESCRIPTION_PROTOCOL}}` | 本日の新処方プロトコル |
| `{{TODAY_PRESCRIPTION_AXIS}}` | 今日の指定軸（アイコン + 名前） |
| `{{DAY_OF_YEAR}}` | 1-365 |
| `{{RECENT_PROPOSALS}}` | 過去 14 日の提案リスト（箇条書き） |
| `{{LOCATION}}` | 居住地 |
| `{{USER_DATA}}` | 現在のユーザーデータ（JSON、過去 7 日分） |
| `{{WEEKLY_DATA}}` | 週次データ |
| `{{BLOOD_TEST_DATA}}` | 血液検査 |
| `{{CURRENT_SUPPLEMENTS}}` | 現在のサプリメント |
| `{{SYMPTOM_DATA}}` | 症状データ |
| `{{HRV_DATA}}` | 心拍変動 |
| `{{ACTIVITY_DATA}}` | 活動データ |
| `{{PEM_HISTORY}}` | PEM 履歴 |

### 7.5 プロンプトカタログ（移植対象、全 168+ 個）

#### 7.5.1 universal（共通、7 個）

`universal_daily`, `universal_weekly`, `conversation_analysis`, `supplement_optimizer`, `sleep_analysis`, `nutrition_analysis`, `mental_health`

#### 7.5.2 disease-specific（疾患別、各 daily + research、約 50 疾患 ×2）

ME/CFS（+ `mecfs_pacing`）, depression, bipolar, ptsd, adhd, gad, ocd, panic, sad, anorexia, schizophrenia, burnout, migraine, epilepsy, parkinsons, ms, alzheimers, narcolepsy, long_covid, fibromyalgia, pots, sleep_apnea, thyroid, diabetes_t2, ibs, autoimmune, ra, sle, crohns, ulcerative_colitis, asd, sjogrens, asthma, atopy, ckd, heart_failure, gout, osteoporosis, menopause, endometriosis, thyroid_cancer, liver_disease, cancer_fatigue, copd, chronic_pain, myasthenia, pcos, chronic_prostatitis, dry_eye, tinnitus, vertigo, hashimoto, mcas

#### 7.5.3 inline（UI ボタン用、10+ 個）

`fast_guest_summary`, `plaud_zen_track`, `physician_submission_report`, `image_analysis_food_photo`, `image_analysis_supplement_label`, `blood_test_analysis`, `wearable_data_analysis`, `export_csv_analysis`, `quick_text_analysis`, `email_draft_for_doctor`

> 全プロンプトの本文は `packages/prompts/seed/` に既存 `js/prompts.js` から逐語移植。改変は admin UI から行う。

### 7.6 AI 呼び出し実装

#### 7.6.1 プロバイダフォールバックチェーン

`buildProviderFallbackList(preferredModel)`：
- `claude-*` → `[preferred, opus, sonnet, haiku]`（重複排除）
- `gpt-*` → `[preferred]` のみ
- `gemini-*` → `[preferred]` のみ

すべて失敗時：`_gracefulRefusalFallback()` 相当を返却（クライアントには 200 で safe fallback JSON）。

#### 7.6.2 タイムアウト

- 全体: 55s
- per-provider: 30s（vision/PDF は 50s）

#### 7.6.3 リトライ対象

- 503 Service Unavailable
- AbortError (timeout)
- 5xx general
- ネットワーク失敗

#### 7.6.4 非リトライ

- 401, 403, 404, 400

#### 7.6.5 拒否検出（refusal）

既存パターン継承：
```
/^i'?m sorry[,.]?\s*(but\s*)?i (can'?t|cannot|am not able to|won'?t) (assist|help)/i
/^i (can'?t|cannot) (help|assist) (with|you) (that|this)/i
/^i'?m not able to (assist|help)/i
/^申し訳(ありません|ございません)が.{0,40}(お手伝い|お答え|ご案内)(でき|いたしかね)/
```

検出時：先頭文だけ削って後続を返す、または完全に refusal なら fallback。

#### 7.6.6 PII マスキング

既存 `js/privacy.js` のパターンをサーバ側に移植。デフォルト ON（`user_settings.privacy_anonymize_ai = true`）：

- メール → `[メール]`
- 電話（国際・国内） → `[電話]`
- クレジットカード → `[カード番号]`
- 長数字列 10-16 桁 → `[番号]`
- 郵便番号 → `[郵便番号]`
- 日本住所 → `[住所]`
- 敬称付き氏名 → `[人名]{さん|様|...}`（pronounBlacklist 除外）

#### 7.6.7 Vision / Document 対応

- 画像: jpeg/png/webp, max 10MB, base64 で Anthropic image block / OpenAI image_url。サーバで圧縮（max 1600px, quality 0.85）してから送信。
- PDF: Anthropic document block。50 ページまで。

#### 7.6.8 API キー管理

- **環境変数のみ**:
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `GOOGLE_AI_API_KEY`
- ローテーションは secret manager（fly secrets / GCP Secret Manager / AWS Secrets Manager）。
- フロントには **絶対に露出しない**。
- ユーザーが自分の API キーを使うオプションは v2 では削除（v1 の admin が誤って漏らす原因だった）。

### 7.7 PubMed 検索

- Server worker が `/research/search` を実装。レート制限 NCBI 推奨に従う（3 req/sec、API key 取得で 10 req/sec）。
- esearch + esummary の 2 段呼び出し。
- 結果は 24h Redis キャッシュ。
- 翻訳リンクは `translate.goog` サブドメイン形式（`{host-with-dashes}.translate.goog/...?_x_tr_sl=auto&_x_tr_tl=ja&_x_tr_hl=ja`）。旧 `translate.google.com/translate?u=` は使わない。
- 疾患別の研究 highlights は別 Worker が日次で更新し `research_cache(disease_id, highlights, updated_at)` に保存。

### 7.8 SOMETHING NEW プロトコル実装

- `_getDayOfYear(date)` で 1-365 算出（local timezone）。
- `_getTodayPrescriptionAxis(date) = axes[dayOfYear % 14]`
- `_getRecentProposals(days=14)` で `ai_analyses.parsed.actions` + `ai_recommendations.title` から先頭 40 字をキーに重複排除、最大 20 件返す。
- これらをサーバ側でプロンプト interpolation 時に注入。

### 7.9 グレースフル・フォールバック（クライアント表示）

`error.ai_busy` 時の固定 JSON（§ 6.3）を返却。クライアントは通常応答と同じ UI で表示。

---

## 8. 外部サービス統合

### 8.1 Google Calendar

#### 方式 A: ICS URL（登録不要）
- ユーザーが ICS URL を貼る → サーバが取得 → RFC 5545 パース → `calendar_events` に upsert
- CORS 問題回避のためサーバが直接 fetch。
- 時間範囲：過去 7 日〜未来 90 日。

#### 方式 B: Google OAuth
- スコープ: `https://www.googleapis.com/auth/calendar.readonly`
- OAuth Code Flow + PKCE
- `calendar.list` → `events.list`（singleEvents=true, orderBy=startTime, ページネーション）
- 時間範囲：過去 30 日〜未来 180 日。
- 複数カレンダー対応。誕生日カレンダー（`type='birthday'`）は別表示。
- access_token 失効時は refresh_token で自動更新。

#### スケジュール負荷分析
- `meetings` = !allDay && attendees > 1
- `tasks` = !allDay && attendees <= 1
- `travel` = allDay && location != ''
- `totalHours` から `level` = high (>6h) / medium (3-6h) / low (<3h)
- アドバイス文言（疾患別、ME/CFS 向け PEM 警告等）はサーバが計算してフロントに返す。

### 8.2 Fitbit

- OAuth 2.0 Implicit → v2 では **Authorization Code + PKCE** に移行（サーバ側でトークン交換）
- スコープ: `activity heartrate sleep profile weight nutrition`
- API:
  - `/activities/date/{YYYY-MM-DD}.json`
  - `/sleep/date/{YYYY-MM-DD}.json`
  - `/activities/heart/date/{YYYY-MM-DD}/1d/1min.json`
- 各日ごとに `vitals`, `sleep`, `activity` テーブルに upsert。
- BullMQ で日次同期ジョブ。

### 8.3 Apple Health

- iPhone のヘルスケアアプリ → エクスポート → ZIP → `export.xml` をアップロード。
- サーバで XML stream parse（sax-style、メモリ効率重視。大容量 GB 級対応）。
- 既存対応メトリクス（22 種）を継承：
  - `HKQuantityTypeIdentifierHeartRate`, `RestingHeartRate`, `WalkingHeartRateAverage`, `HeartRateVariabilitySDNN`, `VO2Max`
  - `BloodPressureSystolic`, `BloodPressureDiastolic`, `BodyTemperature`, `OxygenSaturation`(*100), `RespiratoryRate`
  - `StepCount`, `ActiveEnergyBurned`, `BasalEnergyBurned`, `DistanceWalkingRunning`, `FlightsClimbed`, `AppleExerciseTime`, `AppleStandTime`
  - `BodyMass`, `BodyFatPercentage`(*100)
  - `HKCategoryTypeIdentifierSleepAnalysis`, `MindfulSession`
- デバイス推定: `sourceName` に "watch" → `apple_watch`、それ以外 → `iphone`。

#### iOS Shortcut (URL Import)
- 別経路: iOS Shortcut → POST `/integrations/apple-health/quick-import` body: `{ source, items[] }` (Bearer token = ユーザー固有 API key、設定画面で発行)
- ユーザーは Shortcut テンプレートを設定画面からインポート。

### 8.4 Google Fit

- OAuth Code + PKCE。
- スコープ: `fitness.activity.read`, `fitness.body.read`, `fitness.heart_rate.read`, `fitness.sleep.read`, `fitness.blood_pressure.read`, `fitness.oxygen_saturation.read`, `fitness.body_temperature.read`
- `POST /fitness/v1/users/me/dataset:aggregate` で日次バケット集計。

### 8.5 Plaud（音声トランスクリプション）

- インジェストアドレス: `plaud-{userHash}@inbox.cares.advisers.jp` (8 文字 hash)
- 経路: Plaud → メール → Cloudflare Email Worker → API webhook `POST /webhooks/plaud-inbox` (HMAC 署名)
- API がメール本文をパース（既存 `worker/plaud-inbox.js` のロジックを継承：multipart/alternative/mixed の再帰、base64、quoted-printable 対応）
- パース結果を `plaud_inbox` に保存し、`text_entries` に reuse、`/ai/analyze` を BullMQ で enqueue（promptKey=`plaud_zen_track`）。

### 8.6 CSV / JSON インポート

- CSV ヘッダ: `category, type, timestamp, value, ...` の柔軟スキーマ
- JSON: 配列 or 単一オブジェクト
- サーバで zod スキーマ検証、無効行はエラーレポート返却。

### 8.7 Auto-Sync

- v2 ではクライアント駆動ではなく **BullMQ で 30 分ごとにサーバ駆動**。
- イベント源：
  - cron 30min: 全アクティブ統合をチェック
  - webhook（Plaud）
  - manual trigger (`POST /integrations/auto-sync/run`)
- 結果は通知センター（v2 では追加機能）で確認可。

---

## 9. 疾患・補助制度・専門家データ

> seed: `packages/disease-data/`

### 9.1 疾患カタログ（DISEASE_CATEGORIES）

10 大カテゴリ × 110+ 疾患。既存 `js/config.js:36-432` を逐語移植。各疾患：
```yaml
id: mecfs
name: ME/CFS（筋痛性脳脊髄炎/慢性疲労症候群）
icd: 8E49
category: neuro
icon: 🧠
density: high              # 管理密度（事業優先度マトリクス用）
epidemiology:
  world: 67_000_000
  world_label: 約 6,700 万人（推計）
  world_tier: 3
  world_source: レビュー文献
  japan: 200_000
  japan_label: 約 10-30 万人（推計）
  japan_source: 厚労省研究班
metrics:                   # DISEASE_METRICS（疾患別 KPI）
  - id: pem_frequency
    label: PEM発生頻度
    target: 0
    unit: 回/週
    importance: critical
  - id: activity_hours
    ...
```

カテゴリ:
1. **neuro 神経系** (ICD-11: 08) — 13 疾患
2. **mental 精神・行動** (06) — 14 疾患
3. **immune 免疫系** (04) — 15 疾患
4. **reproductive 生殖器・泌尿器** (16-17) — 8 疾患
5. **endocrine 内分泌・代謝** (05) — 10 疾患
6. **cardiovascular 循環器** (11) — 8 疾患
7. **respiratory 呼吸器** (12) — 4 疾患
8. **digestive 消化器** (13) — 6 疾患
9. **connective 筋骨格・結合組織** (15) — 5 疾患
10. **cancer がん経過観察** (02) — 各種

### 9.2 処方軸（PRESCRIPTION_AXES、14 軸）

| id | icon | name | description |
|---|---|---|---|
| nutrition | 🌿 | 食事・栄養の新戦略 | 抗炎症食・低FODMAP・ファスティング・地中海食・腸活 |
| body | 🏃 | 身体的アプローチ | 運動処方・ストレッチ・理学療法・ヨガ・呼吸法 |
| mind | 🧘 | 精神・認知・瞑想 | CBT・ACT・マインドフルネス・ジャーナリング |
| supplement | 💊 | サプリメント・栄養素 | NMN・CoQ10・マグネシウム・D-リボース・グリシン |
| sleep | 😴 | 睡眠・回復 | 睡眠衛生プロトコル・入眠ルーチン・日光曝露 |
| test | 🧬 | 検査・モニタリング | CRP・ビタミンD・HRV・CGM・DUTCH検査 |
| hydration | 💧 | 水分・電解質・入浴 | 塩分補給・エプソムソルト・経口補水液・サウナ |
| light | 🌞 | 光・温度・環境 | 赤色光・朝の日光曝露・ブルーライト遮断 |
| frontline | 💉 | 先端医療・臨床試験 | LDN・BC007・免疫吸着・JAK阻害薬・HBOT |
| community | 🤝 | コミュニティ・つながり | 患者会・Discord・note購読 |
| specialist | 🏥 | 専門医・セカンドオピニオン | 専門医リスト・遠隔診療・難病指定申請 |
| biohack | 🛠 | バイオハック・デバイス | Oura・Garmin・WHOOP・CGM・Nurosym |
| eastern | 🌱 | 東洋医学・伝統療法 | 漢方・鍼灸・薬膳・温泉療法・森林浴 |
| knowledge | 📚 | 情報・学習・研究 | PubMed・ClinicalTrials.gov・患者会ウェビナー |

### 9.3 検査キット（TEST_KITS、15 種）

既存 `js/config.js:581-620` 全件を seed 化。`{id, name, description, price_range, location_type, kit_provider_url}` を保持。

例: `blood_basic`（基本血液検査）, `nk_cell`, `cytokine`, `thyroid`, `vitamin_d`, `cortisol`, `food_allergy`, `gut_flora`, `genetic`, `heavy_metal`, `hormone`(DUTCH), `organic_acid`(OAT), `sleep_study`, `hrv_monitor`, `autoantibody`

### 9.4 遠隔診療プロバイダー（TELEHEALTH_PROVIDERS、11 種）

CLINICS, curon, YaDoc, LINEドクター, いしゃまち, 心療内科オンライン, 統合医療クリニック, Long COVID専門, ピルオンライン, メディカルノート, ユビー症状検索

### 9.5 心理カウンセリング（COUNSELING_PROVIDERS、4 種）

cotree, うららか相談室, Kimochi, メザニン

### 9.6 補助制度（FINANCIAL_SUPPORT、17 種）

| id | 制度名 | カテゴリ | 専門家 |
|---|---|---|---|
| jiritsu_shien | 自立支援医療（精神通院） | medical | sharoushi |
| nanbyou_jyosei | 指定難病医療費助成 | medical | sharoushi |
| shougai_nenkin | 障害年金 | income | sharoushi |
| shoubyou_teate | 傷病手当金 | income | sharoushi |
| kougaku_ryouyou | 高額療養費制度 | medical | sharoushi |
| seishin_techou | 精神障害者保健福祉手帳 | identity | sharoushi |
| shintai_techou | 身体障害者手帳 | identity | sharoushi |
| tokubetsu_shougai_teate | 特別障害者手当 | income | sharoushi |
| iryouhi_koujo | 医療費控除（確定申告） | tax | tax_accountant |
| shougai_koujo | 障害者控除（税制） | tax | tax_accountant |
| rousai | 労災保険給付 | work | sharoushi |
| juukyo_kakuho | 住居確保給付金 | housing | sharoushi |
| seikatsu_hogo | 生活保護 | welfare | sharoushi |
| kaigo_hoken | 介護保険 | care | sharoushi |
| koutsuhi_jyosei | 通院交通費助成（自治体） | local | sharoushi |
| (他 2 制度) | | | |

各制度の申請フォームスキーマ（30+ 項目、`FINANCIAL_SUPPORT_FIELDS`）も seed。

### 9.7 専門家タイプ（PROFESSIONAL_TYPES）

| id | name | icon |
|---|---|---|
| sharoushi | 社会保険労務士 | 📋 |
| tax_accountant | 税理士 | 🧮 |
| lawyer | 弁護士 | ⚖️ |
| counselor | 医療ソーシャルワーカー | 🤝 |
| financial_planner | ファイナンシャルプランナー | 💼 |

### 9.8 アフィリエイトネットワーク（AFFILIATE_NETWORKS）

| id | name | tag |
|---|---|---|
| amazon_jp | Amazon.co.jp | forestvoice-22 |
| rakuten | 楽天市場 | chroniccare |
| iherb | iHerb | CHRONICCARE |
| a8 | A8.net | (publisherId) |
| custom | カスタム | (設定可) |

### 9.9 ゲスト用サンプル（GUEST_SAMPLES / GUEST_REPORT_DATA）

- 各疾患ごとの記録サンプル（3-5 例）→ ゲストユーザーが「サンプル記録で試してみる」で展開
- 架空 30 日データ（6 疾患：mecfs, long_covid, fibromyalgia, migraine, ra, depression）→ 「医師提出レポートサンプル」生成

---

## 10. 管理画面

### 10.1 タブ構成

| タブ | 機能 |
|---|---|
| 📊 ダッシュボード | 総ユーザー数、今月新規、月別トレンド、AI 使用コスト合計 |
| 👥 ユーザー管理 | メール・最終アクセス・記録数のみ（**本文は表示しない**）、検索、CSV エクスポート |
| 📝 プロンプト管理 | 疾患別フィルタ、編集、バージョン履歴、A/B テスト |
| 🤖 AI モデル | モデル一覧、enabled/disabled、デフォルト切替、コスト単価 |
| 🔑 API キー | （v2 では環境変数のみ。UI は読み取り専用で「設定済み」表示） |
| 📈 事業優先度 | 疾患別患者数（log scale）× 管理密度マトリクス |
| 👔 専門家登録 | 社労士・税理士・弁護士・FP・カウンセラー登録 |
| 🛍 商品・アフィリエイト | 商品 CRUD、ストアリンク、収益レポート |
| 📊 使用量 | 日別・モデル別 API 使用量、コスト、ユーザー上位 |
| 🛡 セーフティ | refusal 検出ログ、prompt injection 試行、レート制限 hit |
| 📋 監査ログ | admin 操作履歴 |
| 💾 データ管理 | バックアップ復元、重複排除（ユーザー指定）、論理削除済み hard delete |

### 10.2 セキュリティ

- 全 admin エンドポイントに `role=admin` middleware
- admin 操作は `audit_logs` に記録（actor, action, target, before/after）
- ユーザーデータの本文閲覧は **本人の明示的同意トークン**経由でのみ可（v2 で新規実装：サポートチケット番号を入れると、本人にメールが飛び、本人が許可ボタンを押すと 24h 閲覧可）

### 10.3 初期 admin

- 環境変数 `INITIAL_ADMIN_EMAIL`（例: agewaller@gmail.com）→ migration で `users.role = 'admin'` セット
- 追加 admin は `/admin/users/:id/role` で role 変更

---

## 11. セキュリティ要件

### 11.1 OWASP Top 10 対策

| # | 対策 |
|---|---|
| 1 Broken Access Control | API レイヤで `user_id = jwt.sub` 強制、admin role middleware、Playwright E2E で他人データへのアクセス試験 |
| 2 Cryptographic Failures | TLS 1.2+ 強制、Argon2id、AES-256-GCM、HSTS、Secure cookie |
| 3 Injection | Prepared statements（pg ライブラリ）、zod による入力検証、XSS は React の自動エスケープ + DOMPurify（markdown のみ） |
| 4 Insecure Design | Threat model 文書化、レート制限、CSRF token |
| 5 Security Misconfiguration | helmet、CSP（unsafe-inline 禁止、nonce ベース）、X-Frame-Options DENY、no source maps in prod |
| 6 Vulnerable Components | Dependabot、weekly `npm audit`、SBOM 生成 |
| 7 Auth Failures | bcrypt → Argon2id、lockout、MFA は v2.1 で追加 |
| 8 Software & Data Integrity | NPM lockfile 必須、subresource integrity for CDN（CDN は基本使わない）、CI で署名検証 |
| 9 Logging Failures | Pino 構造化、PII マスキング、Sentry 連携 |
| 10 SSRF | サーバ外部 fetch は allowlist（PubMed, Anthropic, OpenAI, Google, Fitbit, allOrigins 代替自前 proxy）、private IP ブロック |

### 11.2 CSP 例

```
default-src 'self';
script-src 'self' 'nonce-{server-generated}';
style-src 'self' 'nonce-{...}' fonts.googleapis.com;
font-src 'self' fonts.gstatic.com;
img-src 'self' data: blob: https://*.googleusercontent.com https://lh3.googleusercontent.com;
connect-src 'self' https://api.cares.advisers.jp;
frame-ancestors 'none';
form-action 'self';
upgrade-insecure-requests;
```

### 11.3 個人情報保護

- 健康データは **要配慮個人情報**として扱う（個人情報保護法）。
- データ最小化：必要なフィールドのみ。
- 保持期間：ユーザーが削除を要求するまで（退会後 30 日で hard delete）。
- 削除権：`/me` DELETE で論理削除、30 日後にバッチで物理削除。
- アクセス権：`/me/export` で全データを JSON で出力。
- プライバシーポリシーに「AI 学習に使わない」「第三者提供しない」を明記。
- プライバシーマーク取得準備中の旨を継続表記。

### 11.4 既存 v1 の脆弱性継承防止

- ❌ ダークテーマ追加禁止
- ❌ `localStorage.clear()` 禁止（v2 では `Store` 抽象化、`clearAll()` のみ）
- ❌ `confirm()` / `alert()` 禁止（lint ルール `no-restricted-globals`）
- ❌ `signInWithPopup` → Authorization Code Flow に統一
- ❌ API キーをコードにハードコード禁止（gitleaks + pre-commit）
- ❌ datestamped モデル ID をハードコード禁止（既存 pre-commit ルールを継承）
- ❌ `translate.google.com/translate?u=` 禁止（translate.goog のみ）
- ❌ ユーザー UI に「AI」リテラル禁止（lint ルール）

### 11.5 pre-commit / CI チェック

- gitleaks: secret 検出
- ESLint カスタムルール:
  - `no-restricted-globals` で `confirm`, `alert` 禁止
  - `no-restricted-syntax` で `localStorage.clear()` 禁止
  - 正規表現で `AIza[0-9A-Za-z_-]{35}`, `sk-ant-`, `sk-proj-`, `claude-[0-9a-z.-]+-[0-9]{8}`, `gpt-[0-9a-z.-]*-\d{4}-\d{2}-\d{2}` 検出
- TypeScript strict mode、noUncheckedIndexedAccess
- Playwright E2E: 認証バイパス、他ユーザーデータアクセス試験
- npm audit + Snyk

---

## 12. テスト戦略

### 12.1 単体テスト

- **API**: Vitest。全エンドポイント、認可、バリデーション、エラーパス。target coverage 80%+。
- **Web**: Vitest + Testing Library。フォーム、状態遷移。
- **shared**: zod schema の round-trip テスト。

### 12.2 統合テスト

- API ↔ DB: テスト用 Postgres コンテナ（testcontainers）でマイグレーションから seed まで実行。
- AI モック: Anthropic / OpenAI / Google は msw でモック化、実 API は契約テストのみ（CI 上 nightly）。

### 12.3 E2E（Playwright）

主要シナリオ：
1. **signup → email verify → login → quick input → AI 分析 → logout**
2. **Google OAuth → first profile setup → disease select → dashboard**
3. **データ入力 → タイムライン表示 → エクスポート**
4. **PubMed 検索 → 翻訳リンク click**
5. **Plaud webhook → 自動分析**
6. **Apple Health XML import → vitals 確認**
7. **アカウント削除 → 30 日後 hard delete 確認**
8. **admin: プロンプト編集 → バージョン履歴**
9. **他人データ access 試行（403 確認）**
10. **オフライン → 書き込み拒否、読み取りキャッシュ確認**

### 12.4 負荷テスト

- k6 で 100 concurrent users、AI 分析含む。
- DB 接続プール、Redis レート制限、AI プロバイダフェイルオーバを検証。

### 12.5 セキュリティテスト

- OWASP ZAP automated baseline scan in CI
- 半年ごとに外部ペンテスト

---

## 13. インフラ・デプロイ

### 13.1 環境変数

```
# Database
DATABASE_URL=postgres://...
DATABASE_REPLICA_URL=postgres://...
REDIS_URL=redis://...

# Auth
JWT_SECRET=...                       # 64-byte random
ENCRYPTION_KEY_V1=...                # 32-byte hex
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
FITBIT_CLIENT_ID=...
FITBIT_CLIENT_SECRET=...

# AI
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_AI_API_KEY=...

# Storage
S3_ENDPOINT=https://...              # R2 / S3
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=health-diary-prod
S3_REGION=auto

# Mail
RESEND_API_KEY=...
MAILER_FROM=noreply@cares.advisers.jp
MAILER_FROM_NAME=健康日記

# Plaud
PLAUD_WEBHOOK_HMAC_SECRET=...

# App
APP_BASE_URL=https://cares.advisers.jp
API_BASE_URL=https://api.cares.advisers.jp
ALLOWED_ORIGINS=https://cares.advisers.jp
INITIAL_ADMIN_EMAIL=agewaller@gmail.com
NODE_ENV=production
LOG_LEVEL=info
SENTRY_DSN=...
```

### 13.2 ドメイン構成

- `cares.advisers.jp` → Web (React, Cloudflare CDN)
- `api.cares.advisers.jp` → API (Fastify)
- `ai.cares.advisers.jp` → v1 互換 redirect → `api.cares.advisers.jp/v1/ai/proxy`（既存ブックマーク救済）
- `inbox.cares.advisers.jp` → Cloudflare Email Worker → API webhook

### 13.3 GitHub Actions

```
.github/workflows/
├── ci.yml                  # PR ごとに lint + test + build
├── deploy-api.yml          # main push → build → migrate → blue/green
├── deploy-web.yml          # main push → build → Cloudflare Pages
├── deploy-worker.yml       # cron jobs（PubMed updater, weekly backup）
├── security-scan.yml       # weekly: ZAP + npm audit + gitleaks
└── e2e-nightly.yml         # 本番相当 staging で full E2E
```

### 13.4 マイグレーション戦略

- `drizzle-kit` で SQL マイグレーション管理。
- 全マイグレーションは **無停止デプロイ可能**な形に（NOT NULL 追加は default 付き → backfill → NOT NULL の 3 段階等）。
- ロールバック手順を migration ごとに `down.sql` で必須記述。

### 13.5 バックアップ

- DB: managed の continuous backup + 日次論理ダンプを S3 へ（暗号化、30 日保持）。
- Object Storage: バージョニング有効、誤削除 30 日 retention。
- 月次でリストアドリル実施（QA staging へ）。

### 13.6 監視・SLO

- SLO:
  - API 可用性 99.5%
  - p95 latency < 800ms（AI 系除く）
  - AI 系 p95 < 30s（タイムアウト 55s）
- アラート:
  - 5xx 率 > 1% / 5min → PagerDuty
  - DB 接続失敗 > 0 / 1min
  - AI プロバイダ全滅
  - ディスク > 80%

---

## 14. v1 → v2 移行

### 14.1 既存ユーザーへのアナウンス

- 移行期間 2 ヶ月：旧サイトに「新版に移行しました。データ移行はこちら」バナー。
- 既存ユーザーは v1 サイトで「データをエクスポート」（JSON）→ v2 サイトで新規登録 → 「v1 からインポート」を実行。
- 自動移行は **やらない**（Firestore → Postgres の自動同期はバグ温床。手動の方が安全）。

### 14.2 移行ツール

- v1 サイトの設定画面に「v2 用エクスポート」ボタン追加（最後の v1 リリースで実装）。
- v2 サイトの設定画面に「v1 からインポート」ボタン。
- インポート時：すべて `recorded_at` を保持しつつ重複検出。

### 14.3 v1 サイト終了

- v2 リリース 6 ヶ月後に v1 を read-only 化、12 ヶ月後に shutdown。
- v1 のドメインは v2 にリダイレクト。

---

## 15. 受け入れテスト基準（Definition of Done）

リリース判定の checklist：

### 15.1 機能（網羅）

- [ ] **認証**: signup (email/Google) / login / refresh / logout / password reset / email verify
- [ ] **プロフィール**: 編集 / 疾患選択（10 カテゴリ・110+ 疾患）
- [ ] **記録**: text_entries, symptoms, vitals, sleep, activity, nutrition, medications, supplements, blood_tests, photos の CRUD
- [ ] **クイック入力**: 自由文 + 写真 → 自動分解 + AI 分析
- [ ] **タイムライン**: 全カテゴリ統合表示、フィルタ
- [ ] **ダッシュボード**: HealthGauge、最新分析、Top 3 推奨、メトリックチャート
- [ ] **アクション**: 推奨カード、商品リンク、棄却・完了
- [ ] **研究**: PubMed 検索、日本語翻訳リンク、疾患別キャッシュ
- [ ] **AI 相談**: マルチターン会話、画像添付、プロンプト切替
- [ ] **連携**: Google Calendar (ICS + OAuth)、Fitbit、Google Fit、Apple Health XML、Plaud webhook、CSV/JSON インポート
- [ ] **設定**: プロフィール / 言語 / モデル / プライバシー / セッション
- [ ] **補助制度**: 17 制度ガイド、申請フォーム、専門家へメール送信
- [ ] **管理画面**: ユーザー / プロンプト / モデル / 専門家 / 商品 / 使用量 / セーフティ / 監査 / データ
- [ ] **エクスポート/インポート**: 全データ JSON 出力、v1 互換インポート
- [ ] **PWA**: manifest、SW、オフライン読み取り
- [ ] **印刷**: 医師提出レポート A4
- [ ] **ゲストモード**: 認証なし quick analyze + sample data

### 15.2 AI / プロンプト

- [ ] PROMPT_HEADER（共通ヘッダ、9 言語ディレクティブ、3 必須要素、SOMETHING NEW プロトコル、疫学コンテキスト）
- [ ] DEFAULT_PROMPTS 全 168+ 個 を seed
- [ ] INLINE_PROMPTS 10+ 個
- [ ] 14 軸ローテーション（`dayOfYear % 14`）
- [ ] 過去 14 日提案除外
- [ ] フォールバックチェーン (Anthropic Opus → Sonnet → Haiku、エラー時 Gemini)
- [ ] PII マスキング 8 種
- [ ] refusal 検出 4 パターン
- [ ] vision (image) + PDF document 対応
- [ ] api_usage コスト計算（モデル別 USD/JPY 換算）

### 15.3 セキュリティ

- [ ] 全 API で認可テスト pass（他人データ 403）
- [ ] CSP 違反ゼロ（report-only で 1 週間検証後 enforce）
- [ ] gitleaks pass
- [ ] OWASP ZAP baseline pass
- [ ] レート制限 全エンドポイント
- [ ] cookie 全て HttpOnly/Secure/SameSite

### 15.4 i18n

- [ ] ja + en フル翻訳
- [ ] 11 言語は機械翻訳 seed（手直し可）
- [ ] 「AI」リテラルがユーザー UI に出ない（lint）
- [ ] translate.goog 形式のリンクのみ

### 15.5 デプロイ

- [ ] CI 全 pass
- [ ] migration up/down 動作確認
- [ ] バックアップ・リストアドリル成功
- [ ] Sentry 受信確認
- [ ] healthz endpoint 動作
- [ ] DNS 切替計画

---

## 16. 漏れ確認チェックリスト（仕様書自己レビュー）

以下、v1 にあって v2 仕様書で **明示的に扱われている** ことを再確認：

| v1 機能 / v1 問題 | v2 章 | 状態 |
|---|---|---|
| Firebase Auth (Email/Google) | § 4 | ✅ 自前 JWT + Google OAuth に置換 |
| Firestore ユーザーデータ | § 2 | ✅ Postgres スキーマ移植 |
| Firestore セキュリティルール | § 2.9, § 4.3 | ✅ API レイヤ強制 |
| `enableAutoSync` / `subscribeToCollections` | § 1, § 8.7 | ✅ サーバ駆動 BullMQ に置換 |
| Firestore 週次バックアップ | § 13.5 | ✅ DB 物理バックアップに統一 |
| Cloudflare Worker anthropic-proxy | § 7.6 | ✅ API サーバに統合 |
| Worker plaud-inbox | § 8.5 | ✅ webhook 経由 |
| Worker professional-mailer | § 3.7, § 6.4 | ✅ API に統合 |
| Worker research-updater | § 7.7 | ✅ BullMQ ジョブに |
| Worker learning-orchestrator | § 1, § 13.3 | ✅ ジョブに（または Phase 2 で機能化） |
| 13 言語 i18n | § 6 | ✅ i18next で全文字列キー化 |
| Google 翻訳 translate.goog | § 7.7 | ✅ 仕様に明記 |
| 110+ 疾患 | § 9.1 | ✅ seed 移植 |
| 14 処方軸 | § 9.2 | ✅ 移植 |
| 15 検査キット | § 9.3 | ✅ |
| 11 遠隔診療 | § 9.4 | ✅ |
| 4 カウンセリング | § 9.5 | ✅ |
| 17 補助制度 + 30+ フォーム項目 | § 9.6 | ✅ |
| 5 専門家タイプ | § 9.7 | ✅ |
| アフィリエイト 5 ネットワーク | § 9.8 | ✅ |
| ゲストサンプル + 医師提出レポートサンプル | § 9.9 | ✅ |
| 168+ プロンプト | § 7.5 | ✅ seed |
| PROMPT_HEADER 9 言語ディレクティブ | § 7.3 | ✅ |
| SOMETHING NEW（14 軸ローテ + 過去 14 日除外） | § 7.8 | ✅ |
| 疫学コンテキスト | § 7.3 | ✅ |
| PII マスキング 8 種 | § 7.6.6 | ✅ |
| refusal 検出 | § 7.6.5 | ✅ |
| プロバイダフォールバック | § 7.6.1 | ✅ |
| Vision + PDF | § 7.6.7 | ✅ |
| PubMed (esearch + esummary, 翻訳リンク) | § 7.7 | ✅ |
| ICS Calendar 取り込み | § 8.1 | ✅ |
| Google Calendar OAuth + 複数カレンダー | § 8.1 | ✅ |
| Fitbit Activity + Sleep + HR | § 8.2 | ✅ |
| Apple Health 22 メトリクス | § 8.3 | ✅ |
| Apple iOS Shortcut import | § 8.3 | ✅ |
| Google Fit aggregate | § 8.4 | ✅ |
| Plaud メール受信 (RFC 5322 multipart, base64, quoted-printable) | § 8.5 | ✅ |
| CSV/JSON インポート | § 8.6 | ✅ |
| Auto-Sync スケジューラ | § 8.7 | ✅ サーバ駆動 |
| クイック入力 → 自動症状抽出 | § 3.3 | ✅ |
| 健康スコアゲージ (Mifflin-St Jeor + 症状スコア) | § 5.3 | ✅ |
| BMR 計算 | § 5.3 (component) + § 2.2 (profile) | ✅ |
| api_usage コスト追跡 (5000 件上限) | § 2.4 (rollup で代替), § 10 | ✅ |
| 画像圧縮 (max 1600, q=0.85) | § 5.3, § 7.6.7 | ✅ |
| morphdom (vanilla JS 用) | § 5.2 | ❌ 不要（React） |
| Chart.js | § 5.3 (内製 or Recharts) | ✅ 別ライブラリで |
| Service Worker キャッシュ + commit hash 注入 | § 5.4 | ✅ Workbox |
| アプリ内ブラウザ警告 (LINE/Instagram) | § 5.4, § 6.2 | ✅ |
| admin: プロンプト管理 | § 10.1 | ✅ + バージョン履歴 |
| admin: ユーザーダッシュボード | § 10.1 | ✅ 本文非表示 |
| admin: 事業優先度マトリクス | § 10.1 | ✅ |
| admin: 専門家登録 | § 10.1 | ✅ |
| admin: データ管理 (バックアップ復元、重複排除) | § 10.1 | ✅ |
| admin: API 使用量 | § 10.1 | ✅ |
| 管理者 agewaller@gmail.com ハードコード | § 4.3, § 10.3 | ✅ 削除、INITIAL_ADMIN_EMAIL に |
| ダークテーマ追加禁止 | § 5.3, § 11.4 | ✅ |
| confirm/alert 禁止 | § 5.3, § 11.4 | ✅ lint |
| localStorage.clear() 禁止 | § 11.4 | ✅ lint |
| signInWithPopup 廃止 | § 4.1 | ✅ Code Flow |
| datestamped モデル ID ハードコード禁止 | § 7.1, § 11.5 | ✅ |
| ユーザー UI に「AI」リテラル禁止 | § 5.6, § 11.4 | ✅ |
| 印刷スタイル A4 | § 5.5 | ✅ |
| PWA manifest + theme #6C63FF | § 5.4 | ✅ |
| 構造化データ (JSON-LD) | § 5.4 (実装時) | ✅ schema.org Organization / WebApplication / MedicalCondition |
| Google Analytics | (Phase 2 / 任意) | △ Plausible 推奨 |

**= 重大な漏れ無し**。Phase 2 候補のみ別記。

### Phase 2 候補（v2.0 出荷後）

- 患者コミュニティ / フォーラム
- ClinicalTrials.gov 連携
- 音声読み上げ（TTS）
- MFA / WebAuthn
- iOS / Android ネイティブアプリ
- B2B プラン
- 学習コンパニオン（v1 の learning-orchestrator Worker 相当）

---

## 17. 動作検証（受け入れ前の自動検証）

エンジニアが「実装完了」と宣言する前に必ず緑になること：

```bash
# Lint + Type
pnpm lint
pnpm typecheck

# Unit + Integration
pnpm test
pnpm test:integration

# E2E（local stack: docker-compose up）
pnpm e2e

# Security
pnpm audit --audit-level=high
gitleaks detect --redact
zap-baseline.py -t https://staging.cares.advisers.jp

# Migration
pnpm db:migrate up && pnpm db:migrate down && pnpm db:migrate up
pnpm db:seed

# Smoke (staging)
curl -fsS https://api.staging.cares.advisers.jp/healthz
```

---

## 18. 重要ファイル参照（v1 から逐語移植する seed）

エンジニアは以下を逐語で移植・参照：

| v1 path | v2 destination |
|---|---|
| `js/config.js:36-432` (DISEASE_CATEGORIES) | `packages/disease-data/seed/diseases.yaml` |
| `js/config.js:434-580` (PRESCRIPTION_AXES + DISEASE_METRICS) | `packages/disease-data/seed/{axes,metrics}.yaml` |
| `js/config.js:581-620` (TEST_KITS) | `packages/disease-data/seed/test-kits.yaml` |
| `js/config.js:620-800` (TELEHEALTH_PROVIDERS) | `packages/disease-data/seed/telehealth.yaml` |
| `js/config.js:820-860` (COUNSELING_PROVIDERS) | `packages/disease-data/seed/counseling.yaml` |
| `js/config.js:914-1200` (FINANCIAL_SUPPORT + fields) | `packages/disease-data/seed/support-programs.yaml` |
| `js/prompts.js` 全体 | `packages/prompts/seed/*.md` |
| `js/i18n.js` 全翻訳キー | `packages/shared/i18n/{lang}.json` |
| `js/ai-engine.js:78-92` (`_languageDirectiveFor`) | `apps/api/src/ai/language-directives.ts` |
| `js/ai-engine.js:103-191` (epidemiology, prescription protocol, recent proposals) | `apps/api/src/ai/context-builder.ts` |
| `js/ai-engine.js:362-388` (refusal detection) | `apps/api/src/ai/refusal.ts` |
| `js/ai-engine.js:464-477` (graceful fallback) | `apps/api/src/ai/fallback.ts` |
| `js/privacy.js` (PII masking) | `apps/api/src/privacy/anonymizer.ts` |
| `worker/anthropic-proxy.js:53-69` (SAFE_SYSTEM_PROMPT) | `apps/api/src/ai/system-prompt.ts` |
| `worker/anthropic-proxy.js:102-177` (extractDiseaseIds, 73 patterns) | `apps/api/src/ai/disease-detector.ts` |
| `worker/plaud-inbox.js:159-320` (RFC 5322 parser) | `apps/api/src/integrations/plaud/email-parser.ts` |
| `worker/professional-mailer.js` | `apps/api/src/integrations/mailer/professional.ts` |
| `js/calendar.js:235-296` (ICS parser RFC 5545) | `apps/api/src/integrations/calendar/ics-parser.ts` |
| `js/calendar.js:343-374` (schedule load analysis) | `apps/api/src/integrations/calendar/load-analyzer.ts` |
| `js/integrations.js:438-544` (Apple Health XML parse) | `apps/api/src/integrations/apple-health/xml-parser.ts` |
| `js/store.js:304-325` (BMR Mifflin-St Jeor) | `apps/web/src/utils/bmr.ts` |
| `js/store.js:266-292` (health score) | `apps/web/src/utils/health-score.ts` |
| `index.html` `:root` CSS variables | `apps/web/src/styles/tokens.css` |
| `.githooks/pre-commit` 7 パターン | `.husky/pre-commit` + ESLint rules |

---

## 19. オープン質問（実装着手前に決める）

以下、エンジニアが実装前にプロダクトオーナーに必ず確認すべき項目：

1. **ホスティング先確定** — Fly.io か Hetzner+systemd か。コスト試算（推定 月額: 〜$80 small + DB managed $50-100）。
2. **オブジェクトストレージ** — Cloudflare R2 vs AWS S3 vs Wasabi。R2 推奨（egress 無料）。
3. **メール送信** — Resend 確定？ Sendgrid 比較。
4. **Sentry プラン** — 個人向け free か Team plan。
5. **ドメイン** — `cares.advisers.jp` 継続か新ドメインか。
6. **既存 Firebase プロジェクト** — `care-14c31` は移行完了後何ヶ月で停止するか。
7. **既存ユーザー数とデータ量** — 移行ツールのスケール見積もりに必要。
8. **管理者 email リスト** — agewaller@gmail.com のみ？ 他追加は？
9. **アフィリエイトタグの本番値** — Amazon (forestvoice-22), Rakuten (chroniccare), iHerb (CHRONICCARE) で確定？
10. **法務** — プライバシーポリシー・利用規約・特定商取引法表記の更新（弁護士レビュー）。

---

## 完了基準

この仕様書は以下を満たす：

- [x] v1 の全機能を網羅（§ 16 で確認）
- [x] データ消失の根本原因（Firestore + autosync race condition + onSnapshot 初期空）を解消する設計（§ 0.1, § 1, § 8.7）
- [x] API キー漏洩の根本原因（クライアント側保持）を解消（§ 7.6.8）
- [x] PII / 健康データの保護要件を明示（§ 11.3）
- [x] 各機能に対応する v1 ソース参照を併記（§ 18）
- [x] エンジニア発注用の受け入れ基準を含む（§ 15, § 17）
- [x] 推定工数：MVP 3〜4 ヶ月（チーム規模 3-4 名、フロント・バック・ジョブを並列）+ 全機能 +2 ヶ月

**END OF SPEC**
