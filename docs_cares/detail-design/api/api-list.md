# API 一覧（cares 新仕様）

新仕様 cares が公開する全エンドポイントの一覧。

ベース URL は環境ごとに異なる。本書では path のみ記述。詳細は [`README.md`](README.md)。

凡例:
- 🔓 認証不要
- 🔐 認証必要（OIDC ID token）
- 🛡️ 管理者必要（三段フェイルセーフ）
- 🌊 SSE ストリーミング

---

## 1. ヘルス・メタ

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/health` | 🔓 | ヘルスチェック（Cloud Run の readiness/liveness） |
| GET | `/version` | 🔓 | ビルドバージョン |
| GET | `/api/openapi.json` | 🔓 | OpenAPI 仕様の公開 |

---

## 2. 認証関連

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/auth/login` | 🔓 | Keycloak へリダイレクト（OIDC authorization request） |
| GET | `/api/auth/callback` | 🔓 | Keycloak からの認可コードを受け取り token 取得 → セッション cookie 設定 |
| POST | `/api/auth/logout` | 🔐 | セッション破棄 + **Keycloak Backchannel logout で全サービス同時ログアウト**（cares / VM / zen-track） |
| GET | `/api/auth/me` | 🔐 | 現在のユーザー情報（global_uid, user_id, email, roles） |
| POST | `/api/auth/anonymous` | 🔓 | 匿名認証（SSO 圏外）。一時的なローカル user を発行 |
| POST | `/api/auth/upgrade-anonymous` | 🔐 | 匿名ユーザーを正規アカウントへ昇格（既存データを保持） |
| POST | `/api/cache-key` | 🔐 | IndexedDB 暗号化キャッシュ用のセッションバウンド鍵を払い出し |

### 2.1 `POST /api/cache-key`

ADR-0007 のセッションバウンド鍵払い出し。

**リクエスト**: ボディなし、`Cookie: session=...` 必要

**レスポンス 200**
```json
{
  "key": "base64-encoded-256bit-aes-key",
  "validUntil": "2026-05-26T15:00:00Z"
}
```

クライアントは `key` をメモリ + IndexedDB メタに保持し、IndexedDB に書く前に AES-GCM で暗号化する。ログアウトで完全削除。

---

## 3. ユーザープロファイル

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/users/me/profile` | 🔐 | 自分のプロファイル取得 |
| PUT | `/api/users/me/profile` | 🔐 | プロファイル更新 |
| GET | `/api/users/me/preferences` | 🔐 | UI 設定取得（locale, selected_model 等） |
| PUT | `/api/users/me/preferences` | 🔐 | UI 設定更新 |
| GET | `/api/users/me/diseases` | 🔐 | 選択中の疾患 ID 配列 |
| PUT | `/api/users/me/diseases` | 🔐 | 疾患選択を更新 |
| DELETE | `/api/users/me` | 🔐 | アカウント削除（ソフト削除、30 日後にハード削除） |

### 3.1 `GET /api/users/me/profile`

**レスポンス 200**
```json
{
  "userId": "uuid",
  "displayName": "平岡 みち子",
  "age": 65,
  "gender": "female",
  "currentMedications": ["ロキソニン", "アムロジピン"],
  "allergies": ["ペニシリン"]
}
```

`currentMedications` / `allergies` は DB では暗号化保管、BE で復号して返す。

---

## 4. 健康データ（9 カテゴリ）

各カテゴリは同じ CRUD パターンを持つ。代表例は `symptoms`。他カテゴリ（`vitals`, `blood-tests`, `medications`, `meals`, `sleep-records`, `photos`, `activities`, `moods`, `text-entries`）も同様。

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/{category}` | 🔐 | 一覧取得（ページネーション・フィルタ） |
| GET | `/api/{category}/{id}` | 🔐 | 1 件取得 |
| POST | `/api/{category}` | 🔐 | 新規作成 |
| PUT | `/api/{category}/{id}` | 🔐 | 更新 |
| DELETE | `/api/{category}/{id}` | 🔐 | ソフト削除 |
| POST | `/api/{category}/{id}/restore` | 🔐 | ソフト削除のリストア（30 日以内） |

### 4.1 `GET /api/symptoms?from=2026-05-01&to=2026-05-26&limit=50&cursor=...`

**レスポンス 200**
```json
{
  "items": [
    {
      "id": "uuid",
      "recordedAt": "2026-05-25T12:00:00Z",
      "conditionLevel": 6,
      "sleepQuality": 7,
      "memo": "..."
    }
  ],
  "nextCursor": "opaque-cursor-string-or-null"
}
```

### 4.2 `POST /api/symptoms`

**リクエスト**
```json
{
  "recordedAt": "2026-05-26T07:30:00Z",
  "conditionLevel": 5,
  "sleepQuality": 6,
  "memo": "朝の頭痛 軽度"
}
```

**レスポンス 201**
```json
{
  "id": "new-uuid",
  "recordedAt": "...",
  "conditionLevel": 5,
  ...
}
```

### 4.3 `POST /api/photos`

写真はマルチパートまたは事前に Signed URL を取得して直接 Cloud Storage に PUT。

**フロー**:
1. `POST /api/photos/upload-url` → Signed URL を返す
2. クライアントが Signed URL に直接 PUT
3. `POST /api/photos` で メタを登録（gcs_object_path, photo_type 等）

---

## 5. AI

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| POST | `/api/ai/chat` | 🔐 🌊 | 会話型相談、ストリーミング |
| POST | `/api/ai/analyze/daily` | 🔐 | 日々の AI 解析（記録投稿時に呼ばれる） |
| POST | `/api/ai/analyze/deep` | 🔐 | 本格的な深堀解析（1 日 1 回） |
| POST | `/api/ai/analyze/timeline` | 🔐 | タイムライン解析 |
| POST | `/api/ai/analyze/image` | 🔐 | 画像解析（食事・検査・処方箋等） |
| POST | `/api/ai/reports/doctor` | 🔐 | 医師提出レポート生成 |
| POST | `/api/ai/summaries` | 🔐 | 3 受け手向け要約（doctor/sns/relative） |
| GET | `/api/ai/conversations` | 🔐 | 会話一覧 |
| GET | `/api/ai/conversations/{id}` | 🔐 | 会話詳細（messages 含む） |
| DELETE | `/api/ai/conversations/{id}` | 🔐 | 会話削除（ソフト） |
| GET | `/api/ai/quota` | 🔐 | 自分の今期コスト使用状況 |

### 5.1 `POST /api/ai/chat` 🌊

**リクエスト**
```json
{
  "conversationId": "uuid-or-null",
  "message": "最近の体調変化を分析してください",
  "modelId": "anthropic-opus-4-7"
}
```

**処理**
1. 認証検証
2. `GET /api/ai/quota` 相当の判定 → 上限超過なら 422
3. `audit_logs` に「ai_chat start」記録
4. `ai_messages` にユーザー発言保存（暗号化）
5. Anthropic SDK で stream=true 呼び出し
6. SSE chunk を素通し
7. 完了後、`ai_messages` にアシスタント応答保存、`ai_usage_logs` 更新

**レスポンス 200** `text/event-stream`
```
event: message_start
data: {"conversationId": "uuid"}

event: content_delta
data: {"delta": "体調の傾向を確認..."}

event: content_delta
data: {"delta": "してみます..."}

event: message_stop
data: {"inputTokens": 1234, "outputTokens": 567, "costJpy": 12.34}
```

**エラー**
- 422: コストキャップ超過
- 503: AI プロバイダ障害（管理者通知）

### 5.2 `POST /api/ai/analyze/deep`

**リクエスト**
```json
{
  "modelId": "anthropic-opus-4-7"
}
```

**処理**
- `analyses` で `analysis_type='deep' AND run_date=今日（JST）` の存在チェック
- 存在すれば 409 Conflict
- なければ蓄積データを抽出 → AI 呼び出し → `analyses` に保存

**レスポンス 200**
```json
{
  "id": "uuid",
  "result": "...",
  "modelUsed": "claude-opus-4-7",
  "runDate": "2026-05-26"
}
```

### 5.3 `GET /api/ai/quota`

**レスポンス 200**
```json
{
  "month": "2026-05",
  "usedJpy": 234.56,
  "capJpy": 1000.0,
  "remainingJpy": 765.44,
  "estimatedRemainingChats": 50,
  "isBlocked": false
}
```

---

## 6. 研究検索

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/research/pubmed?q=...&limit=10` | 🔐 | PubMed 検索 + AI 日本語要約。キャッシュあり |
| GET | `/api/research/pubmed/{pmid}` | 🔐 | 特定論文の詳細 |

---

## 7. 連携 / 外部サービス

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/integrations/calendar/oauth-url` | 🔐 | Google Calendar OAuth URL 取得 |
| GET | `/api/integrations/calendar/callback` | 🔐 | OAuth callback → refresh token を `oauth_tokens` に暗号化保存 |
| POST | `/api/integrations/calendar/sync` | 🔐 | 通院予定を取得・取り込み |
| POST | `/api/integrations/calendar/events` | 🔐 | 服薬リマインド等を Google Calendar に作成 |
| GET | `/api/integrations/calendar/ics` | 🔐 | 自分の予定を ICS で配信 |
| POST | `/api/integrations/inbox/plaud` | 🔓 | Plaud メール受信エンドポイント（メールサービスからのコールバック） |
| GET | `/api/integrations/inbox/messages` | 🔐 | 自分の未処理メッセージ一覧 |
| POST | `/api/integrations/inbox/messages/{id}/process` | 🔐 | メッセージを処理（テキスト → 解析 → 保存） |
| POST | `/api/integrations/email/professional` | 🔐 | 専門家にメール送信（テレヘルス・カウンセラー等） |

### 7.1 `POST /api/integrations/inbox/plaud` 🔓

メール受信サービス（SendGrid Inbound Parse / Google Workspace Gmail API）が叩く webhook。Shared secret で認証（HMAC）。

**処理**
1. HMAC 検証
2. `to` アドレスから hash 抽出
3. `inbox_messages` に保存（user_id は hash → user 解決）

---

## 8. エクスポート

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/export/json` | 🔐 | 全データを JSON で取得（ダウンロード） |
| GET | `/api/export/csv` | 🔐 | 全データを CSV で取得 |
| POST | `/api/export/pdf` | 🔐 | PDF レポート生成（医師提出用等）。Cloud Storage に保存後 Signed URL を返す |
| GET | `/api/export/fhir` | 🔐 | FHIR R4 形式で取得 |

### 8.1 `GET /api/export/json`

**レスポンス 200**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Disposition: attachment; filename="cares-export-{userId}-{timestamp}.json"

{
  "exportedAt": "2026-05-26T15:00:00Z",
  "userId": "uuid",
  "profile": {...},
  "symptoms": [...],
  "vitals": [...],
  "blood_tests": [...],
  "medications": [...],
  ...
}
```

監査ログに「export by self」を記録。

---

## 9. 監査ログ（ユーザー可視化）

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/audit-logs/me` | 🔐 | 自分のデータへのアクセス履歴 |

### 9.1 `GET /api/audit-logs/me?limit=50&cursor=...`

**レスポンス 200**
```json
{
  "items": [
    {
      "id": "uuid",
      "eventAt": "2026-05-25T14:23:11Z",
      "actorType": "admin",
      "actorDisplay": "管理者",
      "action": "read",
      "targetTable": "symptoms",
      "targetIdShort": "abc123",
      "details": null
    },
    {
      "eventAt": "2026-05-25T14:00:00Z",
      "actorType": "self",
      "action": "export",
      "details": {"format": "json"}
    }
  ],
  "nextCursor": "..."
}
```

`actor_user_id` は具体 UUID をユーザーには見せず、`actorType` と `actorDisplay`（「管理者」「あなた」「システム」）に集約。

---

## 10. ドラフト（autosave）

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/drafts/{formKind}` | 🔐 | フォーム種別のドラフトを取得 |
| PUT | `/api/drafts/{formKind}` | 🔐 | ドラフトを保存（autosave、複数回呼ばれる想定） |
| DELETE | `/api/drafts/{formKind}` | 🔐 | ドラフトを破棄（提出完了時 / 明示破棄） |

### 10.1 `PUT /api/drafts/symptom`

**リクエスト**
```json
{
  "payload": {
    "conditionLevel": 5,
    "memo": "入力中..."
  }
}
```

**レスポンス 200**
```json
{
  "updatedAt": "...",
  "expiresAt": "..."
}
```

---

## 11. 管理者 API 🛡️

すべて三段フェイルセーフ（Keycloak ロール `admin` OR `OWNER_EMAIL` 一致 OR `x-admin-token`）の認可ガードを通過する必要がある。

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/admin/users` | 全ユーザー一覧 |
| GET | `/api/admin/users/{id}` | ユーザー詳細 |
| GET | `/api/admin/users/{id}/data` | ユーザーの蓄積データ |
| POST | `/api/admin/users/{id}/restore` | ソフト削除アカウントのリストア |
| GET | `/api/admin/prompts` | プロンプト一覧 |
| GET | `/api/admin/prompts/{key}` | プロンプト詳細（全バージョン） |
| POST | `/api/admin/prompts/{key}/versions` | 新バージョン作成 |
| POST | `/api/admin/prompts/{key}/activate` | 特定バージョンをアクティブ化 |
| POST | `/api/admin/keys` | API 鍵を Secret Manager に保存 |
| GET | `/api/admin/key-status` | 鍵設定状況（`{ anthropic: true, openai: false, ... }`、鍵値は返さない） |
| GET | `/api/admin/audit-logs` | 全監査ログ閲覧（フィルタ可） |
| GET | `/api/admin/ai-usage` | 全ユーザー AI 使用量集計 |
| POST | `/api/admin/users/{id}/quota-override` | コストキャップの個別上書き |
| POST | `/api/admin/roles/grant` | Keycloak ロール `admin` を付与（Keycloak Admin API 経由） |
| GET | `/api/admin/models` | AI モデル一覧取得（`ai_models` テーブル） |
| POST | `/api/admin/models` | 新規モデル追加 |
| PUT | `/api/admin/models/{id}` | モデル更新（有効/無効、デフォルト切替、コスト更新） |
| DELETE | `/api/admin/models/{id}` | モデル削除（ソフト: is_enabled = false 推奨） |
| GET | `/api/admin/notifications` | 通知キャンペーン一覧 |
| POST | `/api/admin/notifications` | 通知キャンペーン作成（subject, body, send_at, target_filter） |
| POST | `/api/admin/notifications/{id}/send` | 即時送信 |
| DELETE | `/api/admin/notifications/{id}` | キャンセル |

### 11.1 `POST /api/admin/keys`

旧仕様継続。

**リクエスト**
```json
{
  "keys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-...",
    "google": "..."
  }
}
```

または鍵クリア:
```json
{ "clear": ["anthropic"] }
```

**処理**: Secret Manager の `ANTHROPIC_API_KEY` 等に書き込み（または削除）。`secret_status` テーブルを更新。

**レスポンス 200**: `{ "ok": true, "updated": ["anthropic"] }`

### 11.2 `GET /api/admin/key-status`

旧仕様継続。**鍵値は返さない**。

**レスポンス 200**
```json
{
  "anthropic": true,
  "openai": true,
  "google": false
}
```

---

## 12. レート制限

| エンドポイント群 | 制限 |
|---|---|
| `/api/ai/*` | ユーザー 1 人あたり 60 req/min |
| 認証系（login, callback） | IP あたり 30 req/min |
| 一般 API | ユーザー 1 人あたり 600 req/min |
| 管理 API | 管理者 1 人あたり 120 req/min |

実装は Cloud Run の前段 LB or BE 内 middleware（Memorystore Redis を後付けする場合あり）。

---

## 13. CORS / Origin

| 環境 | 許可 Origin |
|---|---|
| prod | `https://cares.advisers.jp` |
| staging | `https://staging.cares.advisers.jp` |
| dev | `https://dev.cares.advisers.jp`, `http://localhost:3000` |

不正 Origin は 403 で拒否。

---

## 14. エラーレスポンス形式（共通）

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | QUOTA_EXCEEDED | RATE_LIMITED | INTERNAL",
    "message": "ヒューマンリーダブルな日本語メッセージ",
    "details": { ... }
  },
  "requestId": "uuid"
}
```

`requestId` は Cloud Logging との突合に使う。

---

## 15. 未確定 / 詳細設計で詰める項目

- 各 AI エンドポイントの **詳細レスポンス schema**（フェーズ 3 詳細設計）
- ファイルアップロード（Signed URL）の有効期限・サイズ上限
- レート制限の実装（Cloud Armor / アプリ middleware）
- WebSocket / Long polling の必要性検討（現状 SSE のみ）
- 国際化対応の API 設計（locale ヘッダ vs URL prefix）
