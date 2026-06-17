# テーブル定義書 (DDL)

PostgreSQL DDL ベースの正本テーブル定義。schema.md ([../../basic-design/er/schema.md](../../basic-design/er/schema.md)) の論理仕様を DDL に落とした版。Prisma `schema.prisma` の自動生成元としては schema.prisma が正本だが、人が読む DDL レベルの正本は本ファイル。

> **実装状況 (2026-06-01)**: `packages/db/prisma/schema.prisma` に実装済みのテーブルと、設計のみ（未実装）のテーブルがある:
>
> - **実装済 (21)**: users, user_preferences, symptoms, vitals, medications, sleep_records, activities, meals, blood_tests, moods, text_entries, photos, analyses, doctor_reports, audit_logs, ai_usage_logs, secrets, prompts, prompt_versions, ai_models, notifications_config
> - **設計のみ・未実装**: user_profiles, oauth_tokens, ai_conversations, ai_messages, summaries（機能は doctor_reports に統合）, inbox_messages, calendar_events, cached_research, drafts, shares, share_invitations, export_jobs
> - **設計と実装の差分**: secret_status（フラグのみの設計）→ 実装は `secrets` テーブルに**値ごと**保管（Secret Manager 統合は未実装）。**暗号化対象カラム (BYTEA) はすべて未実装**（text_entries.content は現状平文 TEXT）

## 共通方針

- スネークケース、複数形
- PK: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`（または明示）
- すべてのデータテーブルに `tenant_id` / `user_id` / `created_at` / `updated_at` / `deleted_at` を含める（一部例外あり）
- ソフト削除は `deleted_at TIMESTAMPTZ`（30 日後に GC ジョブでハード削除、ADR-0012 / 0013）
- 暗号化カラムは `BYTEA`（アプリ層 AES-GCM、Secret Manager 鍵）
- インデックス命名: `idx_<table>_<columns>`
- 外部キー命名: `fk_<table>_<column>`

---

## 1. 認証・ユーザー

```sql
-- 1.1 users — ADR-0014 で global_uid を直接保管 (Firebase UID、旧 user_link テーブルは廃止)
CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    global_uid    TEXT         NOT NULL UNIQUE,  -- Firebase Auth UID (immutable identity)
    email         TEXT         NOT NULL UNIQUE,
    display_name  TEXT,
    is_anonymous  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

-- 1.2 user_link は廃止 (ADR-0014 / 2026-05-26)
-- 旧設計: Keycloak の global_uid と内部 user_id を user_link テーブルで分離
-- 新設計: Firebase UID を users.global_uid に直接保管 (単一 IdP なので分離不要)
-- API middleware は prisma.user.upsert({where:{globalUid: decoded.uid}, ...}) で
-- 初回ログイン時に自動 provision する

-- 1.3 user_profiles
CREATE TABLE user_profiles (
    user_id              UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age                  INTEGER,
    gender               TEXT,
    current_medications  BYTEA,        -- 暗号化対象
    allergies            BYTEA,        -- 暗号化対象
    selected_diseases    JSONB,
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 1.4 user_preferences
CREATE TABLE user_preferences (
    user_id          UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    locale           TEXT         NOT NULL DEFAULT 'ja',
    selected_model   TEXT,
    feature_flags    JSONB,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 1.5 oauth_tokens
CREATE TABLE oauth_tokens (
    id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider                 TEXT         NOT NULL,                -- google_calendar / fitbit
    encrypted_refresh_token  BYTEA        NOT NULL,                -- 暗号化対象
    expires_at               TIMESTAMPTZ,
    scope                    TEXT,
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, provider)
);
```

---

## 2. 健康データ (9 カテゴリ + テキスト)

共通カラム (`id`, `tenant_id`, `user_id`, `created_at`, `updated_at`, `deleted_at`) を共通マクロ風に記述。

```sql
-- 2.1 symptoms
CREATE TABLE symptoms (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_at     TIMESTAMPTZ  NOT NULL,
    condition_level INTEGER      NOT NULL CHECK (condition_level BETWEEN 1 AND 10),
    sleep_quality   INTEGER      CHECK (sleep_quality BETWEEN 1 AND 10),
    memo            TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_symptoms_user_recorded ON symptoms(user_id, recorded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_symptoms_tenant ON symptoms(tenant_id, deleted_at);

-- 2.2 vitals
CREATE TABLE vitals (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_at     TIMESTAMPTZ  NOT NULL,
    heart_rate      INTEGER,
    blood_pressure  TEXT,                          -- "120/80"
    temperature     DECIMAL(4,1),
    spo2            INTEGER,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_vitals_user_recorded ON vitals(user_id, recorded_at DESC) WHERE deleted_at IS NULL;

-- 2.3 blood_tests
CREATE TABLE blood_tests (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID         NOT NULL,
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_date     DATE         NOT NULL,
    wbc           DECIMAL,
    rbc           DECIMAL,
    hemoglobin    DECIMAL,
    crp           DECIMAL,
    extra_values  JSONB,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_blood_tests_user_date ON blood_tests(user_id, test_date DESC) WHERE deleted_at IS NULL;

-- 2.4 medications
CREATE TABLE medications (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    taken_at    TIMESTAMPTZ  NOT NULL,
    name        TEXT         NOT NULL,
    dosage      TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_medications_user_taken ON medications(user_id, taken_at DESC) WHERE deleted_at IS NULL;

-- 2.5 meals
CREATE TABLE meals (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID         NOT NULL,
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    eaten_at     TIMESTAMPTZ  NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

-- 2.6 sleep_records
CREATE TABLE sleep_records (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date            DATE         NOT NULL,
    duration_hours  DECIMAL(4,2),
    quality         INTEGER      CHECK (quality BETWEEN 1 AND 10),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- 2.7 photos (実体は Cloud Storage、DB はメタのみ) ─ 実装: 2026-05-26
-- bucket / IAM / lifecycle 詳細は infra/gcs.md 参照
CREATE TABLE photos (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID         NOT NULL,
    user_id            UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gcs_object_path    TEXT         NOT NULL,    -- photos/{user_id}/{id}.jpg or deleted/photos/...
    mime_type          TEXT         NOT NULL,    -- image/jpeg|png|webp
    size_bytes         INTEGER      NOT NULL,    -- 8 MB cap
    status             TEXT         NOT NULL DEFAULT 'draft',  -- draft/ready/failed
    photo_type         TEXT,                       -- food/blood_test/prescription/supplement/medical_doc/device/body/other
    ai_classification  JSONB,                      -- pass2 (inline_image_food 等) の構造化結果
    ai_model_used      TEXT,
    ai_analyzed_at     TIMESTAMPTZ,
    ai_error           TEXT,                       -- quota_exceeded / classify_failed: ... 等
    related_category   TEXT,                       -- meals/medications/blood_tests/text_entries
    related_record_id  UUID,
    captured_at        TIMESTAMPTZ  NOT NULL,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at         TIMESTAMPTZ
);
CREATE INDEX photos_user_id_captured_at_idx ON photos (user_id, captured_at DESC);
CREATE INDEX photos_user_id_status_idx ON photos (user_id, status);
CREATE INDEX photos_related_idx ON photos (related_category, related_record_id);

-- 2.8 activities
CREATE TABLE activities (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_at     TIMESTAMPTZ  NOT NULL,
    step_count      INTEGER,
    distance_km     DECIMAL(6,2),
    active_minutes  INTEGER,
    source          TEXT         NOT NULL DEFAULT 'manual',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- 2.9 moods
CREATE TABLE moods (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID         NOT NULL,
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_at  TIMESTAMPTZ  NOT NULL,
    mood_level   INTEGER      NOT NULL CHECK (mood_level BETWEEN 1 AND 10),
    mood_tags    JSONB,
    memo         TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

-- 2.10 text_entries (暗号化対象)
CREATE TABLE text_entries (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID         NOT NULL,
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_at  TIMESTAMPTZ  NOT NULL,
    content      BYTEA        NOT NULL,    -- 暗号化対象
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);
CREATE INDEX idx_text_entries_user_recorded ON text_entries(user_id, recorded_at DESC) WHERE deleted_at IS NULL;
```

---

## 3. AI

```sql
-- 3.1 ai_conversations
CREATE TABLE ai_conversations (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID         NOT NULL,
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title            TEXT,
    started_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_message_at  TIMESTAMPTZ,
    deleted_at       TIMESTAMPTZ
);
CREATE INDEX idx_ai_conversations_user_last ON ai_conversations(user_id, last_message_at DESC) WHERE deleted_at IS NULL;

-- 3.2 ai_messages (暗号化対象)
CREATE TABLE ai_messages (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID         NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role             TEXT         NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content          BYTEA        NOT NULL,    -- 暗号化対象
    model_used       TEXT,
    input_tokens     INTEGER,
    output_tokens    INTEGER,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);

-- 3.3 analyses
CREATE TABLE analyses (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID         NOT NULL,
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_type  TEXT         NOT NULL,        -- daily/deep/timeline/image
    result         TEXT         NOT NULL,
    model_used     TEXT,
    run_date       DATE,                          -- JST、deep の日次制約用
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ
);
-- deep 解析は同日 1 回まで (BR-01)
CREATE UNIQUE INDEX uq_analyses_deep_daily ON analyses(user_id, analysis_type, run_date)
    WHERE analysis_type = 'deep';

-- 3.4 doctor_reports
CREATE TABLE doctor_reports (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID         NOT NULL,
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    format         TEXT         NOT NULL,        -- carte/sns/relative
    content        TEXT         NOT NULL,
    export_format  TEXT,                          -- pdf/json/fhir
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ
);

-- 3.5 summaries
CREATE TABLE summaries (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID         NOT NULL,
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audience      TEXT         NOT NULL CHECK (audience IN ('doctor', 'sns', 'relative')),
    content       TEXT         NOT NULL,
    generated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);
```

---

## 4. 連携

```sql
-- 4.1 inbox_messages (Plaud 等)
CREATE TABLE inbox_messages (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    hash          TEXT         NOT NULL,
    user_id       UUID         REFERENCES users(id) ON DELETE CASCADE,
    kind          TEXT         NOT NULL,
    raw_text      TEXT         NOT NULL,
    processed     BOOLEAN      NOT NULL DEFAULT FALSE,
    received_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    processed_at  TIMESTAMPTZ
);
CREATE INDEX idx_inbox_hash_processed ON inbox_messages(hash, processed);

-- 4.2 calendar_events
CREATE TABLE calendar_events (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID         NOT NULL,
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source       TEXT         NOT NULL,           -- google_calendar/manual
    external_id  TEXT,
    title        TEXT         NOT NULL,
    start_at     TIMESTAMPTZ  NOT NULL,
    end_at       TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_calendar_external ON calendar_events(user_id, source, external_id)
    WHERE external_id IS NOT NULL;

-- 4.3 cached_research (PubMed 等のクエリキャッシュ)
CREATE TABLE cached_research (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash  TEXT         NOT NULL UNIQUE,
    query       TEXT         NOT NULL,
    results     JSONB        NOT NULL,
    cached_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ  NOT NULL              -- TTL 7 日
);
```

---

## 5. 運用・監査

```sql
-- 5.1 audit_logs
CREATE TABLE audit_logs (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    event_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actor_type        TEXT         NOT NULL,      -- self/admin/system/integration
    actor_user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
    action            TEXT         NOT NULL,      -- read/write/delete/export
    target_table      TEXT         NOT NULL,
    target_id         UUID,
    target_user_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    details           JSONB,
    visible_to_user   BOOLEAN      NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_audit_target_visible ON audit_logs(target_user_id, event_at DESC)
    WHERE visible_to_user = TRUE;

-- 5.2 ai_usage_logs
CREATE TABLE ai_usage_logs (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider       TEXT           NOT NULL,
    model          TEXT           NOT NULL,
    input_tokens   INTEGER        NOT NULL,
    output_tokens  INTEGER        NOT NULL,
    cost_jpy       DECIMAL(10,4)  NOT NULL,
    purpose        TEXT,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_usage_user_created ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_user_month ON ai_usage_logs(user_id, (date_trunc('month', created_at)));

-- 5.3 drafts (autosave)
CREATE TABLE drafts (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    form_kind   TEXT         NOT NULL,
    payload     JSONB        NOT NULL,         -- 暗号化検討: BYTEA に変更可
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ  NOT NULL,
    UNIQUE (user_id, form_kind)
);

-- 5.4 prompts / prompt_versions
CREATE TABLE prompts (
    key              TEXT         PRIMARY KEY,
    description      TEXT,
    current_version  TEXT,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TABLE prompt_versions (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_key   TEXT         NOT NULL REFERENCES prompts(key) ON DELETE CASCADE,
    version      TEXT         NOT NULL,
    template     TEXT         NOT NULL,
    updated_by   TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (prompt_key, version)
);

-- 5.5 ai_models (管理画面から CRUD)
CREATE TABLE ai_models (
    id                  TEXT           PRIMARY KEY,
    display_name        TEXT           NOT NULL,
    provider            TEXT           NOT NULL,
    api_model_id        TEXT           NOT NULL,
    input_usd_per_1m    DECIMAL(10,4)  NOT NULL,
    output_usd_per_1m   DECIMAL(10,4)  NOT NULL,
    supports_streaming  BOOLEAN        NOT NULL DEFAULT TRUE,
    supports_vision     BOOLEAN        NOT NULL DEFAULT FALSE,
    is_enabled          BOOLEAN        NOT NULL DEFAULT TRUE,
    is_default          BOOLEAN        NOT NULL DEFAULT FALSE,
    sort_order          INTEGER        NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
-- is_default = TRUE は 1 件のみ
CREATE UNIQUE INDEX uq_ai_models_default ON ai_models((1)) WHERE is_default = TRUE;

-- 5.6 notifications_config
CREATE TABLE notifications_config (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_key   TEXT         NOT NULL UNIQUE,
    subject        TEXT         NOT NULL,
    body           TEXT         NOT NULL,
    send_at        TIMESTAMPTZ,
    sent_at        TIMESTAMPTZ,
    target_filter  JSONB,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by     TEXT
);

-- 5.7 secret_status (鍵値は持たない、フラグのみ)
CREATE TABLE secret_status (
    secret_name      TEXT         PRIMARY KEY,
    is_set           BOOLEAN      NOT NULL,
    last_updated_at  TIMESTAMPTZ,
    updated_by       TEXT
);
```

---

## 6. 共有 (フェーズ 5 後半)

```sql
-- 6.1 shares
CREATE TABLE shares (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_user_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role               TEXT         NOT NULL,    -- viewer/commenter
    scope              JSONB        NOT NULL,
    granted_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at         TIMESTAMPTZ,
    revoked_at         TIMESTAMPTZ
);

-- 6.2 share_invitations
CREATE TABLE share_invitations (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_email  TEXT         NOT NULL,
    status           TEXT         NOT NULL,      -- pending/accepted/declined/expired
    token            TEXT         NOT NULL UNIQUE,
    proposed_scope   JSONB,
    invited_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at       TIMESTAMPTZ  NOT NULL        -- 7 日想定
);
```

---

## 7. 補足

### 7.1 暗号化対象カラム

アプリ層で AES-GCM 暗号化、Secret Manager の `DATA_ENCRYPTION_KEY` を使用。Prisma middleware (`packages/db/encryption.ts` 想定) で透過的に暗号/復号。

- `user_profiles.current_medications`
- `user_profiles.allergies`
- `text_entries.content`
- `ai_messages.content`
- `oauth_tokens.encrypted_refresh_token`
- `drafts.payload` (要検討、性能影響により plain JSONB のままにする選択肢あり)

### 7.2 ハード削除 (GC)

ソフト削除されたレコードは 30 日後に Cloud Run Job で物理削除 (詳細: ADR-0012 / ADR-0013、`apps/migration/gc.ts` 想定)。

### 7.3 マイグレーション

スキーマ変更は Prisma Migrate を通して管理 (ADR-0004)。逆互換でない変更は 2-step デプロイ (ADR-0013 S-4)。

### 7.4 関連

- 論理定義: [`../../basic-design/er/schema.md`](../../basic-design/er/schema.md)
- ER 図: [`../../basic-design/er/er.md`](../../basic-design/er/er.md)
- Prisma スキーマ (実装側、TBD): `packages/db/prisma/schema.prisma`
