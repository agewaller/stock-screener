# cares 運用マニュアル (オーナー / 管理者向け)

本書はオーナー (`agewaller@gmail.com`) および将来の管理者が cares を運用するための実用ガイド。§1〜6 は dev 環境 (ローカル Docker)、§7 は本番 (Cloud Run + Cloud SQL)、§7.9 は staging を扱う。

> ユーザ向けの使い方は [MANUAL.md](MANUAL.md) を参照。

## 全体構成 — どこから何を操作するか

cares の管理操作は次の 3 経路に分類されます。本書もこの順で構成しています。

| 経路 | 用途 | 対象セクション |
|---|---|---|
| **A. Web 画面 (`/admin/*`)** | 日常の運用 (プロンプト編集 / API キー差し替え / ユーザ確認 / 統計閲覧 / 通知キャンペーン) | [§3](#3-web-画面からの管理操作) |
| **B. CLI / スクリプト** | 初回セットアップ / オーナー初期化 / 新規 admin 追加 / DB メンテナンス | [§4](#4-cli--スクリプトからの管理操作) |
| **C. 緊急 (break-glass)** | Web も普通の認証も使えない時のみ。`x-admin-token` ヘッダで直接 API 叩く | [§5](#5-緊急時-break-glass) |

トラブルシューティングは [§6](#6-トラブルシューティング)、未実装一覧は [§7](#7-将来のフェーズ-未実装)。

---

## 1. 必要な前提

### 1.1 ツール

- Docker Desktop (compose v2)
- Node 22 + pnpm 10 (corepack で有効化)
- gcloud CLI (GCP 操作)
- `openssl`, `jq` (秘匿値生成 + JSON 整形)

```sh
nvm use            # → Node 22
corepack enable    # → pnpm 10
gcloud --version   # 500+ 推奨
```

### 1.2 GCP プロジェクト (現用)

| 項目 | 値 |
|---|---|
| Project ID | `arctic-anvil-497002-q2` |
| Project name | `BMP cares-advisers-jp Project` |
| Region | `asia-northeast1` (東京) |
| Billing | 有効 |
| OWNER | `agewaller@gmail.com` (email/password でのみ admin) |

---

## 2. 初回セットアップ (CLI で 1 回だけ)

ここは Web では絶対できません (GCP リソースを作る部分なので CLI 必須)。

### 2.1 gcloud にログイン + プロジェクト選択

```sh
gcloud auth login                                    # ブラウザでログイン
gcloud config set account yano@bresson.biz
gcloud config set project arctic-anvil-497002-q2
```

### 2.2 GCP API を有効化

```sh
gcloud services enable \
  identitytoolkit.googleapis.com \
  firebase.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  storage.googleapis.com \
  --project=arctic-anvil-497002-q2
```

### 2.3 Service Account 鍵 (`infra/firebase-sa.json`)

```sh
SA="cares-firebase-admin@arctic-anvil-497002-q2.iam.gserviceaccount.com"

# 必要なロール (既に付与済の想定):
# - firebaseauth.admin / identitytoolkit.admin
# - storage.objectAdmin (写真機能)
# - iam.serviceAccountTokenCreator (Signed URL)

gcloud iam service-accounts keys create infra/firebase-sa.json \
  --iam-account=${SA}
chmod 600 infra/firebase-sa.json
```

### 2.4 Cloud Storage bucket (写真用、既存セットアップ済)

```sh
gcloud storage buckets describe gs://cares-photos-dev
# 設定詳細は infra/gcs.md 参照
```

### 2.5 Identity Platform で Provider 有効化

ここだけ **Firebase Console (ブラウザ)** が必要 (Google OAuth client が auto-provision されるため):

<https://console.firebase.google.com/project/arctic-anvil-497002-q2/authentication/providers> を開いて:

1. **Email / Password** → 有効化 (Email link はオフ)
2. **Google** → 有効化 (Support email を選択)

### 2.6 `.env` 作成

リポジトリ root の `.env` を作成 (`.env.example` を参考、`.gitignore` 済):

```sh
DATABASE_URL=postgresql://cares:cares@localhost:5432/cares

# Identity Platform (browser-public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=arctic-anvil-497002-q2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=arctic-anvil-497002-q2

# Server-only (秘匿、1 行 JSON)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# 緊急時 admin token (CLI 救済経路、openssl rand -hex 32 で生成)
ADMIN_BREAKGLASS_TOKEN=...

# Auth.js session 暗号化鍵 (openssl rand -hex 32 で生成)
AUTH_SECRET=...

# DB フィールド暗号化鍵 (AES-GCM 256bit / 64 hex、openssl rand -hex 32 で生成)。
# 本番/staging は Secret Manager (cares-data-encryption-key[-staging]) に保管し
# Cloud Run に注入。一度決めたら値を変えない (既存暗号化データが復号不能になる)。
DATA_ENCRYPTION_KEY=

OWNER_EMAIL=agewaller@gmail.com
GCS_PHOTOS_BUCKET=cares-photos-dev

# AI provider (起動時に DB の secrets テーブルへ bootstrap)
ANTHROPIC_API_KEY=sk-ant-...
```

`infra/firebase-sa.json` を 1 行化:
```sh
jq -c . infra/firebase-sa.json   # 結果を FIREBASE_SERVICE_ACCOUNT_JSON='...' に貼る
```

### 2.7 起動

```sh
pnpm install
docker compose up -d --build
docker compose logs api -f      # ログ確認
```

| サービス | URL | 確認 |
|---|---|---|
| Web | <http://localhost:3000> | ログイン画面が出れば OK |
| API | <http://localhost:8080/healthz> | `{"status":"ok"}` |
| DB | localhost:5432 | `docker compose exec cares-db psql -U cares -d cares -c '\dt'` |

### 2.8 オーナー初期化 (CLI、1 回だけ)

```sh
# 1. email/password ユーザを Firebase に作成
docker compose exec api sh -c \
  "cd /app/apps/api && pnpm exec tsx scripts/create-pw-user.ts agewaller@gmail.com agewaller"
# → 標準出力にパスワード再設定リンク (1 回限り、24h で失効)

# 2. リンクをブラウザで開いて初期パスワードを設定

# 3. admin custom claim を付与 (Tier 1)
docker compose exec api sh -c \
  "cd /app/apps/api && pnpm exec tsx scripts/grant-admin.ts agewaller@gmail.com"
```

これで <http://localhost:3000/> から email/password で login → `/admin` に到達できます。以降は **§3 (Web 画面) が日常運用の中心** になります。

---

## 3. Web 画面からの管理操作

OWNER が email/password でログインした状態で **`/admin`** にアクセス。Google ログインだとアクセス不可 ([ADR-0011 Tier 2](adr/0011-admin-model-with-failsafe.md))。

### 3.1 管理画面の入り口

```
http://localhost:3000/admin   ← ハブページ (統計サマリ)
```

ハブから各機能へのリンク。

### 3.2 統計 (`/admin`)

ユーザ数 / 月次 AI コスト / 解析数 / その他主要メトリクスを表示。

### 3.3 API キー管理 (`/admin/keys`)

`POST/GET/DELETE /api/admin/secrets/:name` を呼ぶ UI。

| 操作 | UI |
|---|---|
| Anthropic API key の差し替え | "Anthropic" 行で「変更」→ テキストエリアに新値を貼る → 保存 |
| 設定状況の確認 | `isSet: true/false` のみ表示 (値は **絶対表示されない**) |
| キー削除 | 「削除」ボタン |

**設計原則**: 鍵の値はブラウザに絶対返さない。サーバ側 (DB の `secrets` テーブル) でのみ保管 ([ADR-0011](adr/0011-admin-model-with-failsafe.md))。

### 3.4 プロンプト管理 (`/admin/prompts`)

157 件 (旧 stock-screener から移植 152 件 + cares 固有 5 件) を Web で編集できます。

| 操作 | UI |
|---|---|
| 検索 | 「名前 / key / 説明 で検索」入力欄 |
| 疾患フィルタ | 「すべての疾患 / 共通 / 神経系 / 精神 / ...」セレクト |
| 頻度フィルタ | 「すべての頻度 / 毎日 / 毎週 / 手動 / ...」セレクト |
| 名前変更 | 行をクリックで展開 → 「名前」入力 → 「メタを保存」(PATCH) |
| 対象疾患変更 | 「対象疾患」セレクト (`_universal` か 96 疾患から) |
| スケジュール | `daily` / `weekly` / `on_data_update` / `manual` |
| 無効化 | 「有効 (active)」チェックを外す |
| 本文編集 | 「プロンプト本文」textarea を変更 → 「新バージョン保存」(POST、新版作成) |
| 削除 | 「削除」ボタン |
| 新規追加 | ページ上部「+ 新規プロンプト追加」 → key/name/disease/schedule/template を入力 |

**実行時の使われ方**: `/api/analysis/daily` などが疾患カスケードで resolve (`{疾患}_daily` → `universal_daily` → `daily_brief`)。Web で本文を編集すれば**次の AI 呼び出しから即反映**。

### 3.5 AI モデル管理 (`/admin/ai-models`)

DB の `ai_models` テーブルを編集。現状は実行時に**コード内 `AVAILABLE_MODELS` がマスタ**として使われるため、ここで編集しても直ちには反映されません (将来 DB 駆動に切替予定)。

### 3.6 通知キャンペーン (`/admin/notifications`)

| 操作 | UI |
|---|---|
| キャンペーン作成 | 「+ 新規」→ campaignKey / subject / body / sendAt 入力 |
| 一覧 | 既存キャンペーンを Markdown 表示 |
| 削除 | 各行「削除」ボタン |

**注意**: 実配信は未実装 (SendGrid 連携など)。現状は DB 保管のみ。

### 3.7 ユーザ一覧 (`/admin/users`)

`users` テーブルの行を 200 件まで表示 (email / displayName / 作成日 / 削除フラグ)。

**現状**: admin 権限の Web 上での付与/剥奪は未実装。新規 admin 追加は **CLI ([§4.3](#43-新規-admin-ユーザの追加)) で行います**。

### 3.8 ログアウト

右上の `≡` メニュー → 「ログアウト」。Auth.js session cookie + Firebase の IndexedDB (refresh token) の両方がクリアされます。

---

## 4. CLI / スクリプトからの管理操作

`/admin` 画面では提供していない (= スクリプトでないと困難な) 操作を CLI でやります。実行は **macOS のターミナル** から `docker compose exec` 経由が基本。

### 4.1 ログ確認

```sh
# 全サービス
docker compose logs -f

# API のみ
docker compose logs -f api

# 認証関連のエラー
docker compose logs api | grep -E "auth_missing|auth_verify_failed|invalid_token"

# break-glass 使用 (要監査)
docker compose logs api | grep breakglass_admin_used

# AI 解析エラー
docker compose logs api | grep -E "ai_error|quota_exceeded"

# 写真解析
docker compose logs api | grep -E "photo_analyzed|photo_analyze_quota_exceeded"
```

重要 event:
- `event: "listen"` — API 起動完了 (`auth: "firebase"` を確認)
- `event: "auth_missing"` — Bearer なし 401
- `event: "auth_verify_failed"` — Firebase verifyIdToken 失敗 (token expired 等)
- `event: "breakglass_admin_used"` — Tier 3 使用 (要監査)
- `event: "photo_analyze_quota_exceeded"` — 月次キャップで写真解析スキップ
- `event: "photo_analyzed"` — 写真 AI 分析完了

### 4.2 オーナーのパスワード再発行

```sh
# パスワードを忘れた場合、新しい再設定リンクを発行
docker compose exec api sh -c \
  "cd /app/apps/api && pnpm exec tsx scripts/create-pw-user.ts agewaller@gmail.com"
# → 既存ユーザは email-already-exists で uid だけ返り、再設定リンクが標準出力に出る
```

### 4.3 新規 admin ユーザの追加

OWNER 以外を admin にする場合 (`grant-admin.ts` は **Tier 1 = custom claim** を付与):

```sh
# パターン A: その人が一度 cares に Google ログインする
# → users テーブルに行が自動 provision される
# → その人の email を指定して claim 付与
docker compose exec api sh -c \
  "cd /app/apps/api && pnpm exec tsx scripts/grant-admin.ts other-admin@example.com"

# パターン B: email/password ユーザを Firebase 側に作成してから claim 付与
docker compose exec api sh -c \
  "cd /app/apps/api && pnpm exec tsx scripts/create-pw-user.ts other-admin@example.com 表示名"
# → 出力のリンクをその人に送る → 初期パスワード設定
docker compose exec api sh -c \
  "cd /app/apps/api && pnpm exec tsx scripts/grant-admin.ts other-admin@example.com"
```

**ポイント**: Tier 1 (custom claim) のみで権限を持つ新規 admin は Google ログインでも admin に入れる。Tier 2 の "password 必須" 縛りは OWNER だけの仕様。

### 4.4 DB スキーマ migration

```sh
# 1. packages/db/prisma/schema.prisma を編集

# 2. migration を手書きで作成 (prisma migrate dev は interactive で動かないため)
ts=$(date +%Y%m%d%H%M%S)
mkdir -p packages/db/prisma/migrations/${ts}_my_change
cat > packages/db/prisma/migrations/${ts}_my_change/migration.sql <<EOF
ALTER TABLE ...
EOF

# 3. 適用
docker compose exec api sh -c \
  "cd /app/packages/db && pnpm exec prisma migrate deploy && pnpm exec prisma generate"

# 4. api を再起動
docker compose restart api
```

### 4.5 DB バックアップ (dev)

```sh
docker compose exec cares-db pg_dump -U cares cares > backup-$(date +%Y%m%d).sql
```

### 4.6 DB リセット (dev のみ、本番では絶対やらない)

```sh
docker compose down -v   # ボリュームも削除
docker compose up -d cares-db
docker compose exec cares-db psql -U cares -d cares -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec api sh -c "cd /app/packages/db && pnpm exec prisma migrate deploy"
```

### 4.7 月次コスト確認 (Web より細かく)

`/admin` 統計でも見えますが、ユーザ別の生データが見たい場合:

```sh
docker compose exec cares-db psql -U cares -d cares -c \
  "SELECT user_id, SUM(cost_jpy)
     FROM ai_usage_logs
    WHERE created_at >= date_trunc('month', now())
    GROUP BY user_id;"
```

### 4.8 API キーの DB 直接更新 (Web `/admin/keys` の代替)

```sh
docker compose exec cares-db psql -U cares -d cares -c \
  "UPDATE secrets SET value = 'sk-ant-NEW' WHERE name = 'ANTHROPIC_API_KEY';"
```

通常は `/admin/keys` (§3.3) 経由を推奨。CLI は緊急時のみ。

---

## 5. 緊急時 (break-glass)

Firebase が完全停止しているなど、`/admin` 画面に入れない時のみ使う最終手段。Tier 3 ([ADR-0011](adr/0011-admin-model-with-failsafe.md))。

### 5.1 仕組み

`x-admin-token` ヘッダの値が `.env` の `ADMIN_BREAKGLASS_TOKEN` と一致すれば、Firebase verify をスキップして OWNER_EMAIL ユーザとして API を通します。使用時は API ログに必ず `event: "breakglass_admin_used"` を出力 (監査対象)。

### 5.2 使い方

```sh
# .env から token を取り出す (画面表示はせず、変数経由で使う)
BG=$(grep ^ADMIN_BREAKGLASS_TOKEN .env | cut -d= -f2)

# secrets 一覧を取得 (実値は返らない、isSet のみ)
curl -H "x-admin-token: $BG" http://localhost:8080/api/admin/secrets

# Anthropic API key を更新
curl -X POST -H "x-admin-token: $BG" -H "Content-Type: application/json" \
  -d '{"value":"sk-ant-..."}' \
  http://localhost:8080/api/admin/secrets/ANTHROPIC_API_KEY

# ユーザ一覧
curl -H "x-admin-token: $BG" http://localhost:8080/api/admin/users

# プロンプト一覧
curl -H "x-admin-token: $BG" http://localhost:8080/api/admin/prompts
```

### 5.3 使用後の監査

```sh
docker compose logs api | grep breakglass_admin_used
```

---

## 6. トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `auth: "not_configured"` で API 起動 | `FIREBASE_SERVICE_ACCOUNT_JSON` 未設定 | `.env` を確認、`docker compose up -d api` で再起動 |
| ログイン後すぐ 401 連発 | Firebase ID token が browser に届いていない | DevTools → Network で `/api/auth/callback/credentials` のレスポンスを確認 |
| 1 時間後に全 API が 401 | ID token 1h TTL 切れ | リロード or 再ログイン。長時間滞在画面では `getCurrentIdToken()` で都度 fresh 取得 (写真アップロードは対応済) |
| 写真アップで `gcs_object_missing` | ブラウザ → GCS の PUT 失敗 | Network の PUT リクエストを確認、CORS と signed URL の expires を確認 |
| 写真の AI 分析が `quota_exceeded` | 月次 1000 円超過 | 来月 1 日まで待つか、管理者がユーザ個別の cap を上書き (将来機能) |
| AI 分析が `secret_not_set` | `ANTHROPIC_API_KEY` が DB の secrets テーブルに無い | `/admin/keys` (§3.3) で設定 or `.env` に書いて api 再起動 (bootstrap が DB に upsert) |
| **本番/staging** で記帳が `Internal Server Error` / 画面に `... is not valid JSON` | Cloud Run に `DATA_ENCRYPTION_KEY` が未配線で、本文の AES-GCM 暗号化が throw → 500。フロントが 500 本文を JSON parse して失敗 | `01-create-secrets.sh` で鍵 secret 作成 + `07-deploy-cloud-run.sh` で配線 (現在は両方に組込み済)。詳細 → [incidents/2026-06-09](incidents/2026-06-09-staging-quick-entry-data-encryption-key-missing.md) |
| `/admin` に 403 | OWNER だが Google ログインで入った | 一度ログアウト → email/password で再ログイン ([ADR-0011](adr/0011-admin-model-with-failsafe.md) Tier 2 の意図的な挙動) |
| **本番**で書き込み (記帳/記録 POST) だけ `Failed to fetch`、画面表示は正常 | 再デプロイで API の `ALLOWED_ORIGINS` が placeholder に戻り CORS 不許可 | `07-deploy-cloud-run.sh --only=update-origin --web-url=<WEB>` で更新。詳細 → [incidents/2026-05-29](incidents/2026-05-29-prod-deploy-cors-failed-to-fetch.md) |
| **本番**で写真添付が `GCS PUT network error` | GCS bucket `cares-photos-prod` の CORS に web origin (両 URL 形式) が無い | `08-update-identity-platform-domains.sh <WEB>` で更新。詳細 → [incidents/2026-05-29](incidents/2026-05-29-prod-deploy-cors-failed-to-fetch.md) |

> 本番障害の深掘り記録 (原因調査の筋道 + 恒久対策 + 次回チェックリスト) は [`incidents/`](incidents/README.md) に蓄積している。同じ症状を見たらまずそこを引く。

---

## 7. 本番デプロイ (フェーズ 6 — 最小構成、稼働中)

GCP 単一プロジェクト `arctic-anvil-497002-q2` に Cloud Run + Cloud SQL + GCS + Secret Manager の最小構成で稼働中。リソース命名は suffix `-prod` で dev (Docker compose) と分離。詳細手順は [`infra/scripts/README.md`](../infra/scripts/README.md) を参照。

### 7.1 本番リソース

| リソース | 値 |
|---|---|
| プロジェクト | `arctic-anvil-497002-q2` (BMP cares-advisers-jp Project) |
| リージョン | `asia-northeast1` |
| Cloud Run web | `cares-web` |
| Cloud Run api | `cares-api` |
| Cloud SQL | `cares-db-prod` (PG 16, db-f1-micro, PITR 7d) |
| GCS bucket (写真) | `gs://cares-photos-prod` |
| Artifact Registry | `cares-images` |
| Secret Manager | `cares-db-url-prod` / `cares-db-password-prod` / `cares-firebase-sa-json` / `cares-admin-breakglass-token` / `cares-auth-secret` / `cares-anthropic-api-key` / `cares-data-encryption-key` (フィールド暗号化鍵) |
| Service Account | `cares-firebase-admin@...` (dev と共用) |
| Identity Platform | dev/prod 共用 (1 個) |

### 7.2 本番 URL (default Cloud Run、カスタムドメインは未定)

- Web: <https://cares-web-494881872429.asia-northeast1.run.app>
- API: <https://cares-api-494881872429.asia-northeast1.run.app>
- API healthz: <https://cares-api-494881872429.asia-northeast1.run.app/api/healthz>

### 7.3 初回デプロイ手順

```sh
# 1) GCP リソース構築 (約 5 分、Cloud SQL 作成が支配)
bash infra/scripts/00-enable-apis.sh
bash infra/scripts/01-create-secrets.sh
bash infra/scripts/02-create-bucket-prod.sh
bash infra/scripts/03-create-sql.sh
bash infra/scripts/04-create-artifact-repo.sh

# 2) 本番 DB マイグレーション (cloud-sql-proxy 経由)
bash infra/scripts/05-migrate-prod.sh

# 3) api → web の順でビルド + デプロイ
bash infra/scripts/06-build-push-images.sh --only=api
bash infra/scripts/07-deploy-cloud-run.sh --only=api
API_URL=$(gcloud run services describe cares-api --region=asia-northeast1 --format='value(status.url)')

bash infra/scripts/06-build-push-images.sh --only=web --api-url=$API_URL
bash infra/scripts/07-deploy-cloud-run.sh --only=web --api-url=$API_URL
WEB_URL=$(gcloud run services describe cares-web --region=asia-northeast1 --format='value(status.url)')

# 4) api の ALLOWED_ORIGINS を web URL に更新 (CORS)
bash infra/scripts/07-deploy-cloud-run.sh --only=update-origin --web-url=$WEB_URL

# 5) Identity Platform Authorized Domains + GCS CORS を更新
bash infra/scripts/08-update-identity-platform-domains.sh $WEB_URL
```

### 7.4 更新デプロイ (コード変更後)

```sh
# api のみ更新
bash infra/scripts/06-build-push-images.sh --only=api
bash infra/scripts/07-deploy-cloud-run.sh --only=api

# web のみ更新 (NEXT_PUBLIC_API_URL は build 時 inline なので再 build 必須)
bash infra/scripts/06-build-push-images.sh --only=web --api-url=$API_URL
bash infra/scripts/07-deploy-cloud-run.sh --only=web --api-url=$API_URL
```

> ⚠️ **デプロイ後は必ず CORS を実測する** (B=API / C=GCS)。欠けると本番で `Failed to fetch` /
> `GCS PUT network error` になる。手順とチェックリストは
> [`incidents/2026-05-29`](incidents/2026-05-29-prod-deploy-cors-failed-to-fetch.md#次回チェックリスト-デプロイ後に必ず実行)。
> `_env.sh` の `PROD_*_URL` 既定値により単独再デプロイでも origin は維持されるが、bucket CORS が
> 古い場合は `08-update-identity-platform-domains.sh $WEB_URL` を再実行する。

### 7.5 ロールバック

```sh
bash infra/scripts/99-rollback-cloud-run.sh --service=cares-api
bash infra/scripts/99-rollback-cloud-run.sh --service=cares-web
```

### 7.6 カスタムドメイン後付け (将来)

```sh
CUSTOM=cares.advisers.jp
# DNS で CNAME $CUSTOM → ghs.googlehosted.com
gcloud beta run domain-mappings create --service=cares-web --domain=$CUSTOM --region=asia-northeast1
bash infra/scripts/08-update-identity-platform-domains.sh https://$CUSTOM

# api の ALLOWED_ORIGINS にカンマで追記
gcloud run services update cares-api --region=asia-northeast1 \
  --update-env-vars="ALLOWED_ORIGINS=https://cares-web-xxx.run.app,https://$CUSTOM"
gcloud run services update cares-web --region=asia-northeast1 \
  --update-env-vars="AUTH_URL=https://$CUSTOM"
```

### 7.7 本番初回ログイン (オーナー)

Firebase Auth は dev/prod 共用なので、既存の `agewaller_admin@cares.advisers.jp` でそのまま本番にもログイン可能。初回ログインで prod DB に User row が自動 provision される。

### 7.8 コスト目安

| 項目 | 月額 |
|---|---|
| Cloud Run web/api (min=0) | ~$5 |
| Cloud SQL db-f1-micro 24/7 + Backup | ~$12 |
| GCS Standard | ~$1 |
| Secret Manager + Artifact Registry | ~$1 |
| **合計** | **約 $20 (約 3000 円) / 月** |
| staging 追加分 (§7.9、SQL 停止運用) | +$2〜3 |

将来 Cloud LB + Cloud Armor 追加で +$25/月。

### 7.9 staging 環境 (ADR-0015: 同一プロジェクト共存)

本番デプロイ前の検証用。本番と同じプロジェクト内に `-staging` 接尾辞リソースで共存する
([ADR-0015](adr/0015-staging-environment-in-prod-project.md))。
構築・デプロイ手順の実体は [`infra/scripts/README.md`](../infra/scripts/README.md) の「staging 環境」節。

#### 7.9.1 staging リソース

| リソース | 値 |
|---|---|
| プロジェクト | `arctic-anvil-497002-q2` (本番と同一) |
| Cloud Run web | `cares-web-staging` |
| Cloud Run api | `cares-api-staging` |
| Cloud SQL | `cares-db-staging` (PG 16, db-f1-micro。**普段は停止** = activation-policy NEVER) |
| GCS bucket (写真) | `gs://cares-photos-staging` |
| Artifact Registry | `cares-images-staging` |
| Secret Manager | `cares-db-url-staging` / `cares-db-password-staging` / `cares-admin-breakglass-token-staging` / `cares-auth-secret-staging` / `cares-anthropic-api-key-staging` / `cares-data-encryption-key-staging` (フィールド暗号化鍵) (+ `cares-firebase-sa-json` は prod と共用) |
| Service Account | `cares-run-staging@...` (staging 専用。**prod の secret は読めない**) |
| Identity Platform | prod と共用 (staging の web URL を Authorized Domains に追加) |

#### 7.9.2 staging URL (2026-06-02 構築)

- Web: <https://cares-web-staging-494881872429.asia-northeast1.run.app>
  (別形式: <https://cares-web-staging-xj6szhutkq-an.a.run.app>)
- API: <https://cares-api-staging-494881872429.asia-northeast1.run.app>
  (別形式: <https://cares-api-staging-xj6szhutkq-an.a.run.app>)
- API healthz: <https://cares-api-staging-494881872429.asia-northeast1.run.app/api/healthz>

※ 普段は Cloud SQL が停止しているため、DB 系 API は 500 を返す。検証時は §7.9.3 の手順で SQL を起動する。

#### 7.9.3 運用ルール

- **検証フロー**: SQL 起動 → migrate → api/web デプロイ → 検証 → **SQL 停止** (コスト抑制)
  ```sh
  # 起動
  gcloud sql instances patch cares-db-staging --activation-policy=ALWAYS
  # 停止 (検証後)
  gcloud sql instances patch cares-db-staging --activation-policy=NEVER
  ```
- **SQL 停止中は staging の DB 系 API が 500 を返す** (仕様)
- **認証は本番のユーザープール**: prod の Firebase ユーザ (オーナー含む) でそのままログイン可能。
  staging へ初回ログインすると staging DB に User row が自動 provision される (本番 §7.7 と同じ仕組み)
- **AI キー**: 初期値は prod と同じキー。staging 専用キーへの差し替え:
  ```sh
  printf '%s' "<新しいキー>" | gcloud secrets versions add cares-anthropic-api-key-staging --data-file=-
  CARES_ENV=staging bash infra/scripts/07-deploy-cloud-run.sh --only=api
  ```
  AI 月次キャップ (1000 円) は staging DB で独立してカウントされる
- **デプロイトリガ**:
  - GitHub Actions から手動実行（PC / スマホ可）→ [`DEPLOY_STAGING_GITHUB_ACTIONS.md`](DEPLOY_STAGING_GITHUB_ACTIONS.md)（簡易マニュアル）
  - ローカル（Claude Code）から → リポジトリの [CLAUDE.md](../CLAUDE.md) の「ステージングデプロイしてください」
  - いずれも本番と同じ 2 ゲート: テスト全 green + 明示承認

---

## 8. 将来のフェーズ (未実装)

| 項目 | 状態 |
|---|---|
| Cloud LB + Cloud Armor 統合 (ADR-0013 S-1) | 未着手 |
| Terraform フル IaC (ADR-0013 S-5) | 未着手 (現状 gcloud bash) |
| GitHub Actions CI/CD (ADR-0013 S-4) | test (PR) 済 + **staging 自動デプロイ済** (`deploy-staging.yml` / WIF。本番デプロイの自動化は将来) |
| staging 環境 | **同一プロジェクト共存方式で対応** (ADR-0015 / §7.9)。プロジェクト分離 (ADR-0005 原設計) は将来オプション |
| OpenTelemetry + Cloud Trace | 未着手 |
| 30 日経過の物理削除 GC ジョブ | 未着手 |
| text_entries.content の AES-GCM 暗号化 | 未着手 |
| 通知の実配信 (SendGrid 等) | 未着手 |
| 旧 Firebase Storage からの写真物理移行 | フェーズ 7 |
| CSV / PDF / FHIR エクスポート | 未着手 |
| ValuationMatrix / zen-track との SSO | 別 ADR (Identity Platform 共有) |
| `/admin/users` での admin 権限付与 UI | 未実装 (現状 CLI のみ、§4.3) |
| `/admin/ai-models` の DB 駆動切替 | 未実装 (現状コード内 `AVAILABLE_MODELS` がマスタ) |
| カスタムドメイン (`cares.advisers.jp` 等) | 未決定、決まり次第 §7.6 で後付け |

---

## 関連

- [README.md](../README.md) — 開発セットアップ
- [MANUAL.md](MANUAL.md) — ユーザ向け
- [基本設計書](basic-design/基本設計書.md)
- [詳細設計書](detail-design/詳細設計書.md)
- [ADR 索引](adr/README.md)
- [システム構成図](architecture/system-overview.md)
- [シーケンス: 認証](architecture/sequence/auth-login.md) / [写真](architecture/sequence/photo-upload.md) / [日次分析](architecture/sequence/daily-analysis.md)
- [infra/gcs.md](../infra/gcs.md) — Cloud Storage 運用詳細
