# API 一覧（cares 新仕様）

新仕様 cares が公開する全エンドポイントの一覧。**実装 (`apps/api/src/index.ts`) と同期済み (2026-06-01)**。

ベース URL は環境ごとに異なる。本書では path のみ記述。詳細は [`README.md`](README.md)。

凡例:
- 🔓 認証不要
- 🔐 認証必要（Firebase ID token、ADR-0014）
- 🛡️ 管理者必要（三段フェイルセーフ）

> **本書の管理方針**: 実装 (`apps/api/src/index.ts`) が一次情報。本書は実装に追随して更新する。
> 設計したが未実装の API は [§12 設計のみ・未実装](#12-設計のみ--未実装将来) に分離した。
>
> 認証は **Firebase Auth (Identity Platform)** を直接使う。Keycloak は廃止 ([ADR-0014](../../adr/0014-auth-switch-to-identity-platform.md))。

---

## 1. ヘルス・メタ

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/healthz` | 🔓 | ヘルスチェック。**Cloud Run frontend が intercept して 404 になる場合があるため `/api/healthz` が正本** |
| GET | `/api/healthz` | 🔓 | ヘルスチェック正本（auth middleware を明示的に skip） |
| GET | `/api/models` | 🔐 | 利用可能 AI モデル一覧（現状ハードコード `AVAILABLE_MODELS`。DB 駆動化はフェーズ 5 残作業） |

旧設計の `/health` `/version` `/api/openapi.json` は実装していない。

---

## 2. 認証関連

> **ADR-0014**: ログイン / ログアウトは Web 層（Auth.js v5 Credentials provider）が担う。ブラウザは Firebase JS SDK で Identity Platform に認証して Firebase ID token を取得し、Auth.js のエンドポイント `POST /api/auth/callback/credentials`（Web 側、本 API ではない）に渡す。API (Hono) はリダイレクト型 OIDC エンドポイントを持たず、`Authorization: Bearer <Firebase ID token>` を `firebase-admin` で検証するのみ。Backchannel logout は廃止（cares 単独セッション破棄）。

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/me` | 🔐 | 現在のユーザー情報（userId, email, globalUid, roles, isAdmin, provider） |

認可ミドルウェア:
- `/api/*` 全体に Firebase ID token 検証（skip は `/api/healthz` と `/api/trial/analyze` の 2 つのみ）。検証成功時に `prisma.user.upsert({ where: { globalUid } })` で初回自動 provision
- `/api/trial/analyze` は唯一の公開 AI エンドポイント（[ADR-0016](../../adr/0016-public-trial-ai-endpoint.md)。悪用対策はハンドラ内: IP 3 回/日 + 全体 3000 円/月）
- `/api/admin/*` は加えて三段フェイルセーフ判定（[§9](#9-管理者-api-)）

匿名ログイン (FN-AUTH-03) / 匿名→正規昇格 (FN-AUTH-08) / セッションバウンド鍵 `POST /api/cache-key` (ADR-0007) は**設計のみ・未実装**（[§12](#12-設計のみ--未実装将来)）。

---

## 3. ユーザー設定・使用量・監査ログ

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/me/preferences` | 🔐 | UI 設定取得（locale, selectedModel, selectedDiseases 等。無ければ既定値で自動作成） |
| PATCH | `/api/me/preferences` | 🔐 | UI 設定更新。疾患選択 (FN-DIARY-01) は `selectedDiseases` フィールド |
| GET | `/api/me/usage` | 🔐 | 月次 AI コスト使用状況 (FN-AI-10, BR-20)。`{ monthlyCostJpy, monthlyCapJpy, remainingJpy, exceeded }` |
| GET | `/api/me/audit-logs` | 🔐 | 自分のデータへのアクセス履歴 (FN-AUDIT-01)。actor は「あなた / 管理者 / システム」に集約 |

旧設計の `/api/users/me/*` はパス短縮で `/api/me/*` に、`/api/users/me/diseases` は preferences に統合された。

---

## 4. 健康データ（10 カテゴリ）

### 4.1 カテゴリ別エンドポイント

9 カテゴリ + 写真。各カテゴリは GET（一覧）/ POST（作成）を持つ:

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET / POST | `/api/symptoms` | 🔐 | 症状（conditionLevel 1-10, sleepQuality, memo） |
| GET / POST | `/api/vitals` | 🔐 | バイタル（heartRate, bloodPressure, temperature, spo2） |
| GET / POST | `/api/medications` | 🔐 | 服薬（name, dosage, takenAt） |
| GET / POST | `/api/sleep-records` | 🔐 | 睡眠（date, durationHours, quality） |
| GET / POST | `/api/activities` | 🔐 | 活動（stepCount, distanceKm, activeMinutes） |
| GET / POST | `/api/meals` | 🔐 | 食事（description, eatenAt） |
| GET / POST | `/api/blood-tests` | 🔐 | 血液検査（wbc, rbc, hemoglobin, crp, extraValues） |
| GET / POST | `/api/moods` | 🔐 | 気分（moodLevel 1-10, moodTags, memo） |
| GET / POST | `/api/text-entries` | 🔐 | テキスト記録（content。**暗号化は未実装、現状平文**） |

### 4.2 横断エンドポイント（タイムライン / 編集・削除・復元）

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/records` | 🔐 | 全カテゴリ横断のタイムライン取得（SC-02） |
| GET | `/api/records/{category}/{id}` | 🔐 | 1 件取得 |
| PATCH | `/api/records/{category}/{id}` | 🔐 | 部分更新 (FN-DIARY-05) |
| DELETE | `/api/records/{category}/{id}` | 🔐 | ソフト削除（deleted_at 付与） |
| POST | `/api/records/{category}/{id}/restore` | 🔐 | ソフト削除のリストア |

### 4.3 クイック入力

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| POST | `/api/quick-entry` | 🔐 | テキスト / 写真を AI が分類して複数カテゴリへ同時記録。`Cache-Control: no-store` (ADR-0007) |

---

## 5. 写真（3-step アップロード、ADR-0007）

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| POST | `/api/photos/upload-url` | 🔐 | GCS への PUT 用 Signed URL を発行 |
| POST | `/api/photos/{id}/complete` | 🔐 | GCS 直 PUT 完了後にメタ確定 |
| GET | `/api/photos/{id}/signed-url` | 🔐 | 表示用 Signed URL を都度発行（5 分有効、`Cache-Control: no-store`） |
| GET | `/api/photos?limit=50` | 🔐 | 写真一覧（signed URL は含めない。card render 時に都度発行） |

詳細フロー: [`infra/gcs.md`](../../../infra/gcs.md)。画像も PII（ADR-0007）。

---

## 6. AI 解析

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/analysis/today` | 🔐 | 本日の日次解析結果を取得 (FN-AI-01) |
| POST | `/api/analysis/daily` | 🔐 | 日次解析を実行。月次キャップ超過なら 422 (BR-20、フォールバック禁止 ADR-0006) |
| GET | `/api/analysis/deep/today` | 🔐 | 本日の深堀解析結果を取得 (FN-AI-02) |
| POST | `/api/analysis/deep` | 🔐 | 深堀解析を実行（同日重複は 409、BR-01） |
| GET | `/api/analysis/research/latest` | 🔐 | 研究スキャン（PubMed + AI 要約）の最新結果 (FN-RES-01) |
| POST | `/api/analysis/research` | 🔐 | 研究スキャンを実行 |
| POST | `/api/trial/analyze` | 🔓 | **お試し AI 分析**（FN-TRIAL-01 / [ADR-0016](../../adr/0016-public-trial-ai-endpoint.md)）。未ログインで日記 1 件を AI 分類 → カテゴリ別プロンプトで分析。本文は保存しない。`Cache-Control: no-store` |

共通エラー: `422 ai_quota_exceeded`（月次 1000 円キャップ）、`409`（深堀の同日重複）。

お試し分析の固有エラー: `429 rate_limited`（IP 1 日 3 回、BR-23）、`422 trial_quota_exceeded`（お試し全体 3000 円/月）、`503 unavailable`（AI キー未設定）、`504 timeout`（15 秒超過）、`502 ai_failed`。

---

## 7. レポート（audience 別要約）

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | `/api/reports` | 🔐 | 生成済みレポート一覧 |
| GET | `/api/reports/{id}` | 🔐 | レポート詳細 |
| POST | `/api/reports` | 🔐 | レポート生成。`{ audience: "doctor"\|"sns"\|"relative", periodDays: 7\|30\|90 }` (FN-AI-05〜07) |

PDF 化は未実装（現状 markdown テキストを返す）。

---

## 8. エクスポート

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| POST | `/api/export` | 🔐 | 全データエクスポート。`{ format: "json", periodDays?: number }` |

> **実装状況**: **JSON のみ実装済**。`format` に csv / pdf / fhir を指定すると `400 format_not_supported` を返す。CSV / PDF / FHIR は要件 (FN-INT-05) として維持しつつ別タスクで実装（README「フェーズ 5 残作業」参照）。

---

## 9. 管理者 API 🛡️

すべて三段フェイルセーフ（Firebase Custom Claim `admin:true` OR (`OWNER_EMAIL` 一致 AND `firebase.sign_in_provider === "password"`) OR `x-admin-token`）の認可ガードを通過する必要がある（ADR-0011 改訂 / ADR-0014）。

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/admin/stats` | 利用統計（ユーザー数 / 匿名数 / 月次 AI コスト / 直近 24h 解析数 / 症状記録数） |
| GET | `/api/admin/users` | 全ユーザー一覧 (FN-ADMIN-03) |
| GET | `/api/admin/secrets` | シークレット設定状況（**フラグのみ、値は返さない** ADR-0006 / BR-04） |
| POST | `/api/admin/secrets/{name}` | シークレットを保存（AI API キー等。FN-ADMIN-02） |
| DELETE | `/api/admin/secrets/{name}` | シークレットを削除 |
| GET | `/api/admin/prompts` | プロンプト一覧 (FN-ADMIN-01) |
| POST | `/api/admin/prompts` | プロンプト作成（新バージョン同時作成） |
| PATCH | `/api/admin/prompts/{key}` | プロンプト更新（新バージョン追加 / アクティブ切替） |
| DELETE | `/api/admin/prompts/{key}` | プロンプト削除 |
| GET | `/api/admin/ai-models` | AI モデル一覧（`ai_models` テーブル。FN-ADMIN-06） |
| POST | `/api/admin/ai-models` | AI モデル追加 |
| DELETE | `/api/admin/ai-models/{id}` | AI モデル削除 |
| GET | `/api/admin/notifications` | 通知キャンペーン一覧 (FN-ADMIN-07) |
| POST | `/api/admin/notifications` | 通知キャンペーン作成（**作成・保管のみ。実配信 (SendGrid 等) は未実装**） |
| DELETE | `/api/admin/notifications/{campaignKey}` | キャンペーン削除 |

旧設計からの変更:
- `/api/admin/keys` / `/api/admin/key-status` → `GET/POST/DELETE /api/admin/secrets[/{name}]` に一般化
- `/api/admin/prompts/{key}/versions` + `/activate` → `POST /api/admin/prompts` + `PATCH /api/admin/prompts/{key}` に統合
- 管理者ロール付与 (FN-ADMIN-04) は API 経路ではなく `apps/api/scripts/grant-admin.ts`（Firebase Admin SDK で Custom Claim 付与）
- 全ユーザー監査ログ閲覧・ユーザー詳細・restore・quota-override は**未実装**（[§12](#12-設計のみ--未実装将来)）

---

## 10. CORS / エラー形式（実装ベース）

### CORS

許可 Origin は環境変数 `ALLOWED_ORIGINS`（カンマ区切り）で管理。リストにない Origin は拒否。

> 本番では `07-deploy-cloud-run.sh --only=update-origin` で web URL を反映する。**2 形式 URL（`*.run.app` の新旧両形式）の登録が必要**（[`docs/incidents/`](../../incidents/README.md) 参照）。

### エラー形式

実装はシンプルな flat 形式（旧設計の `{ error: { code, message, details }, requestId }` ネスト形式は不採用）:

```json
{ "error": "ai_quota_exceeded", "detail": "今月の利用上限に達しました。来月までお待ちください" }
```

| HTTP | 代表的な error 値 |
|---|---|
| 400 | `format_not_supported`, `text_or_photo_required`, `text_required`, `text_too_long`, バリデーションメッセージ |
| 401 | `unauthorized`, `invalid_token` |
| 403 | `forbidden`（admin ガード） |
| 404 | `not_found`, `unknown_category` |
| 409 | 深堀解析の同日重複 |
| 422 | `ai_quota_exceeded`（月次キャップ、BR-20）, `trial_quota_exceeded`（お試し全体キャップ、BR-23） |
| 429 | `rate_limited`（お試し分析の IP 制限、BR-23） |
| 502 | `ai_failed`（AI プロバイダエラー） |
| 503 | `unavailable`（AI キー未設定） |
| 504 | `timeout`（お試し分析の 15 秒超過） |

### レート制限

- **`POST /api/trial/analyze`（公開エンドポイント）のみ実装済**: IP 単位 1 日 3 回（`trial_rate_limits` テーブル、生 IP は保存せず SHA-256 ハッシュ）+ お試し全体 3000 円/月キャップ（`trial_usage` テーブル）。BR-23 / [ADR-0016](../../adr/0016-public-trial-ai-endpoint.md)
- 認証必須エンドポイントの per-user レート制限は**未実装**（将来。現状は Cloud Run の同時実行数 + 月次 AI コストキャップで抑制）。

---

## 11. 監査ログの記録

各書き込み・閲覧ハンドラ内で `prisma.auditLog.create` を fire-and-forget で記録（失敗時は `audit_log_failed` をログ出力して処理続行）。ユーザー向け開示は `GET /api/me/audit-logs`。

---

## 12. 設計のみ・未実装（将来）

以下は設計済みだが**実装されていない** API。要件 (FN-*) は維持し、実装はフェーズ 5 残作業以降。

| 設計 API | 関連機能 | 状態 |
|---|---|---|
| `POST /api/cache-key` | ADR-0007 IndexedDB セッションバウンド鍵 | 未実装 |
| `POST /api/account/delete` / `POST /api/account/restore` | FN-AUTH-07 アカウント削除（ソフト削除 → 30 日復元可） | API 未実装（DB は deleted_at 対応済） |
| `POST /api/auth/upgrade-anonymous` | FN-AUTH-08 匿名→正規昇格 | 未実装（FN-AUTH-03 匿名ログイン自体が未実装） |
| `POST /api/ai/chat` (SSE) + `/api/ai/conversations*` | FN-AI-03 会話型相談 | 未実装（`ai_conversations` / `ai_messages` テーブルも未作成） |
| `/api/drafts/{formKind}` (GET/PUT/DELETE) | FN-DIARY-06 / BR-15 ドラフト autosave | 未実装（`drafts` テーブルも未作成） |
| `/api/integrations/calendar/*` | FN-INT-04 Google Calendar 連携 | 未実装 |
| `/api/integrations/inbox/*` | FN-INT-01 Plaud メール受信取込 | 未実装 |
| `/api/integrations/email/professional` | FN-INT-06 専門家メール送信 | 未実装 |
| `/api/export/csv` `/api/export/pdf` `/api/export/fhir` | FN-INT-05 多形式エクスポート | 未実装（JSON のみ。`POST /api/export` に統合予定） |
| `GET /api/admin/audit-logs` | 全ユーザー監査ログ閲覧 | 未実装 |
| `GET /api/admin/users/{id}` `/data` `/restore` `/quota-override` | ユーザー個別管理 | 未実装 |
| `/api/admin/notifications/{id}/send` | FN-ADMIN-07 通知の実配信 | 未実装（作成・保管のみ） |
| 共有 (shares / share_invitations) 系 API | フェーズ 5 後半の共有機能 | 未実装 |
| レート制限 middleware | NFR | 未実装 |

設計時のリクエスト / レスポンス例は git 履歴（2026-05-26 時点の本書）と[詳細設計書](../詳細設計書.md)を参照。
