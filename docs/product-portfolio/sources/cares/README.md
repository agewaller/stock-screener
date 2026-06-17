# cares

健康日記の GCP リアーキテクチャ版。データ主権を最優先に、Firebase 中心の現行サイト (<https://cares.advisers.jp>) を GCP コンテナ + PostgreSQL + GCP Identity Platform (Firebase Auth) 認証で全面刷新するプロジェクト。

- 現行サイト: <https://cares.advisers.jp>（旧リポ: <https://github.com/agewaller/stock-screener>）
- このリポジトリ: 新仕様の実装先（フェーズ 5 機能移植中）

## ドキュメント

実装の根拠は `docs/` 配下:

- [`docs/README.md`](docs/README.md) — ドキュメント全体目次
- [`docs/requirements/`](docs/requirements/) — 要件定義書、インタビュー記録
- [`docs/basic-design/`](docs/basic-design/) — 基本設計書、ER 図
- [`docs/detail-design/`](docs/detail-design/) — 詳細設計書、API 一覧、OpenAPI
- [`docs/adr/`](docs/adr/) — Architecture Decision Records (ADR-0001 〜 ADR-0016)

## フェーズ

| フェーズ | 内容 | 状態 |
|---|---|---|
| 0 | セットアップ | ✓ |
| 1 | 要件再定義 | ✓ |
| 2 | アーキテクチャ設計 | ✓ |
| 3 | 詳細設計 | ✓ |
| 4 | スケルトン実装 (Docker compose / Identity Platform / API / Web / Prisma) | ✓ |
| 5 | 機能移植 | ✓ (記録 10 カテゴリ + 編集削除復元 + 監査ログ + AI 日次/深堀/レポート/研究 + 月次キャップ + 管理画面 + プロンプト DB-driven + 疾患選択 + 写真) |
| 6 | GCP 本番デプロイ (最小構成) | ✓ Cloud Run + Cloud SQL + GCS + Secret Manager で稼働 ([infra/scripts/](infra/scripts/) / [docs/OPERATIONS.md §7](docs/OPERATIONS.md)) |
| 7 | データ移行 (Firestore → PostgreSQL) | 未着手 |

### フェーズ 5 残作業 (主要)

機能単位の実装状況一覧は [要件定義書 §4.1](docs/requirements/要件定義書.md) の「実装状況」列が正本。主要な残作業:

- FN-ADMIN-04 Keycloak Admin API でのロール付与 → Identity Platform に移行済 (`grant-admin.ts` で代替) ✓
- FN-ADMIN-05 ブレークグラス `x-admin-token` の API 配線 ✓
- FN-ADMIN-07 通知の実配信 (SendGrid 等)、現状はキャンペーンの作成・保管のみ
- text_entries.content / ai_messages.content の AES-GCM フィールド暗号化
- ~~写真アップロード (Cloud Storage 統合)~~ ✓ ([ADR-0007](docs/adr/0007-browser-pii-prohibition.md) / `infra/gcs.md`)
- 30 日ハードデリート GC ジョブ (Cloud Scheduler + Cloud Run jobs)
- CSV / PDF / FHIR エクスポート (現状 JSON のみ)
- AI runtime の DB 駆動モデル切替 (現状はハードコード `AVAILABLE_MODELS`)
- FN-AI-03 会話型相談 (チャット UI + 会話永続化)
- FN-AUTH-07 アカウント削除 API / UI (DB ソフト削除は対応済)
- FN-DIARY-06 ドラフト autosave (drafts テーブル + API)
- FN-PROF-01 プロフィール編集 (年齢・性別・既往薬)
- FN-INT-01 Plaud / FN-INT-04 Google Calendar / FN-INT-06 専門家メール
- 未実装ページ: `/chat*` `/history` `/terms` `/privacy` `/goodbye` (実装済みページは `/timeline` `/record` `/report` `/research` `/export` `/audit-log` `/settings` `/trash` `/admin/*`)

## 開発

モノレポ (pnpm workspace)。Node 22 / pnpm 10。

```
cares/
├── apps/
│   ├── web/         # Next.js 15 (App Router, SSR)
│   ├── api/         # Hono on Node
│   └── migration/   # Prisma migrate runner
└── packages/
    ├── shared/      # 共通型・定数
    └── db/          # Prisma client + schema
```

### A. ホストで起動 (pnpm dev)

```sh
nvm use            # → Node 22
corepack enable    # pnpm 10 を有効化
pnpm install
pnpm typecheck
pnpm -r --parallel dev
```

### B. Docker Compose で起動 (推奨)

ホストに Node / pnpm が無くても OK。3 サービス (postgres + Hono + Next.js) を一発起動。

```sh
docker compose up -d --build
```

| サービス | URL | 説明 |
|---|---|---|
| web | <http://localhost:3000> | Next.js dev (hot reload) |
| api | <http://localhost:8080/healthz> | Hono dev (tsx watch) |
| cares-db | localhost:5432 | Postgres 16 (`user=cares db=cares`) |

認証は **GCP Identity Platform (Firebase Auth)** を直接使う ([ADR-0014](docs/adr/0014-auth-switch-to-identity-platform.md))。dev でも本物の GCP プロジェクトを使うので、初回セットアップは以下を参照。

### 認証セットアップ (dev / prod 共通)

1. GCP コンソールで新規プロジェクト作成 (例: `cares-dev-2026`)
2. Identity Platform を有効化 → Providers で **Google** と **Email/Password** を有効化
3. Settings → Authorized domains に `localhost` 追加
4. Project settings → Your apps → Web app 登録 → `apiKey`, `authDomain`, `projectId` をコピー
5. Project settings → Service accounts → "Generate new private key" → JSON ダウンロード

`.env` (リポジトリ root) に以下を設定:

```sh
# Public (browser に出る、Authorized domains で守る)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cares-dev-2026.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cares-dev-2026

# Server-only (秘匿)、service account JSON を 1 行にエスケープ
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# 緊急時 admin token (CLI からの救済経路)
ADMIN_BREAKGLASS_TOKEN=$(openssl rand -hex 32)

OWNER_EMAIL=agewaller@gmail.com
AUTH_SECRET=$(openssl rand -hex 32)
```

オーナーユーザ初期化 (1 回だけ):

```sh
# email/password ユーザ作成 (パスワード再設定リンクが標準出力に出る)
pnpm tsx apps/api/scripts/create-pw-user.ts agewaller@gmail.com

# パスワード設定後、admin custom claim を付与
pnpm tsx apps/api/scripts/grant-admin.ts agewaller@gmail.com
```

ログ追跡:

```sh
docker compose logs -f         # 全サービス
docker compose logs -f api     # 特定サービス
```

停止 / 削除:

```sh
docker compose down            # コンテナ停止
docker compose down -v         # + DB ボリュームも削除
```

### Admin ロックアウト防止

`agewaller@gmail.com` (OWNER) は **email + password でログインしたときだけ admin** になる仕様 (ADR-0011 改訂 / ADR-0014)。Google でログインすると一般ユーザ扱い。これにより Gmail アカウント乗っ取り時に管理画面が保護される。

三段フェイルセーフ:
1. Firebase Custom Claim `admin: true` (`grant-admin.ts` で付与)
2. `OWNER_EMAIL` + `provider === "password"` (script なしでも復旧可能)
3. CLI から `x-admin-token: $ADMIN_BREAKGLASS_TOKEN` ヘッダ (最終救済)

## ライセンス

TBD
