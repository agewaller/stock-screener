# CLAUDE.md — agewaller/cares 開発ガイド

このファイルは Claude Code が読むためのガイド。

## このリポジトリ

健康日記の GCP リアーキテクチャ版（フェーズ 5 機能移植中）。

## まず読むべきもの

1. [`docs/README.md`](docs/README.md) — ドキュメント全体目次
2. [`docs/adr/README.md`](docs/adr/README.md) — ADR 索引（ADR-0001 〜 ADR-0016）
3. 触る箇所に対応する ADR / 詳細設計書を読んでから実装する

## 設計の核（必ず守る）

詳細は ADR 群。ここでは最重要原則のみ:

- **データ主権 5 原則** (ADR-0001、要件定義書 §5.4)
- **ブラウザに PII を置かない** (ADR-0007): localStorage 禁止、IndexedDB は AES-GCM セッションキャッシュのみ、PII 含む HTML は `Cache-Control: no-store`、画像も PII（Signed URL 都度フェッチ）
- **DB フィールド暗号化** (詳細設計書 §2): `text_entries.content`, `ai_messages.content`, `user_profiles.current_medications` / `allergies`, `oauth_tokens.encrypted_refresh_token`, `drafts.payload` の 5 系統はアプリ層 AES-GCM。鍵は Secret Manager
- **AI 鍵はサーバ側のみ** (ADR-0006、ADR-0013 S-7): BYOK 不可、ブラウザ・DB に絶対置かない、フォールバック連鎖禁止、月 1000 円キャップ + 422 拒否、key-status は値を返さない
- **管理者ロックアウト防止** (ADR-0011 改訂 / ADR-0014): Firebase Custom Claim `admin:true` OR (`OWNER_EMAIL` AND `provider==="password"`) OR `x-admin-token` の三段フェイルセーフ。OWNER は **email/password ログインのときだけ admin** (Google ログイン乗っ取り対策)
- **認証基盤** (ADR-0014): GCP Identity Platform (Firebase Auth)。Keycloak セルフホスト (旧 ADR-0002) は廃止。Google + Email/Password の両方を提供
- **認可** (ADR-0004、ADR-0013 S-2): API 内部 row-level + Firebase custom claim。RLS / OPA は不採用
- **削除モデル**: ソフト削除 + 30 日後ハード削除 + restore API（即時ハードではない）
- **コード変更は必ず ADR と整合させる**: 方針変更は新規 ADR または既存 ADR を Superseded で改訂

## 運用トリガ（指示されたら必ず遵守）

ユーザが次のフレーズで指示したら、対応手順を必ず実行する。Node は **22**（`.nvmrc` 準拠 / `nvm use 22`、`corepack enable` で pnpm 10）。

### 「テスト環境を起動して」 → ローカル Docker 環境を起動

- `docker compose up -d --build`（3 サービス: cares-db:5432 / api:8080 / web:3000）。
- `cares-db` が healthy になったら冪等に `docker compose exec api sh -c "cd /app/packages/db && pnpm exec prisma migrate deploy"`。
- `curl http://localhost:8080/healthz`（`{"status":"ok"}`）と web `http://localhost:3000`（200）で疎通確認し URL を報告。
- 「テスト環境を止めて」→ `docker compose down`（**DB ボリュームは残す**。`-v` はユーザの明示要求時のみ）。詳細は [`docs/OPERATIONS.md`](docs/OPERATIONS.md) §2.7。

### 「テストしてください」 → ユニット + 結合（既定）

- 前提: `cares-db` 起動（結合テストは実 Postgres `cares_test` を使う）。
- `pnpm test`（= `test:unit` → `test:integration`。後者は `scripts/setup-test-db.sh` が `cares_test` を作成・migrate）。
- 合否と件数を報告。失敗は `ファイル:行` を添える。
- 「E2Eもテストして」→ フルスタック起動後 `pnpm test:e2e`（公開スモーク + 認証ジャーニー。認証ユーザ準備は [`e2e/README.md`](e2e/README.md)）。「ユニットだけ / 結合だけ / カバレッジ」→ `pnpm test:unit` / `test:integration` / `test:coverage`。
- 注: api には既存の型エラーがあり `tsc --noEmit` は赤だが、テストは vitest/esbuild 実行のため影響しない。

### 「ステージングデプロイしてください」 → GCP staging（必ず2ゲートを通す）

staging は本番と同じ GCP プロジェクト内に `-staging` 接尾辞リソースで共存する（[ADR-0015](docs/adr/0015-staging-environment-in-prod-project.md)）。
全スクリプトに **`CARES_ENV=staging`** を付けて実行する（付け忘れると本番を操作してしまうので必ず確認）。

1. **テスト全実施ゲート（必須）**: 本番と同じ。`pnpm test` オールグリーンを確認。fail があれば中断。
2. **承認ゲート（必須）**: GCP アカウント・プロジェクト・対象コミットを提示し、ユーザの明示承認（「ステージングデプロイ実行OK」）を得る。
3. 承認後:
   - **SQL 起動**（普段は停止）: `gcloud sql instances patch cares-db-staging --activation-policy=ALWAYS` → RUNNABLE まで待機
   - `CARES_ENV=staging bash infra/scripts/05-migrate-prod.sh`（staging DB に migrate）
   - `CARES_ENV=staging` で `06`/`07` を api → web の順に実行（確定 URL は `_env.staging.sh` の既定値が効く）
4. デプロイ後:
   - CORS を実測（本番と同じ方法。バケットは `cares-photos-staging`、サービスは `cares-api-staging`/`cares-web-staging`）
   - ヘルス: `curl <staging-api>/api/healthz`
   - **検証が終わったら SQL を停止**: `gcloud sql instances patch cares-db-staging --activation-policy=NEVER`
- 異常時: `bash infra/scripts/99-rollback-cloud-run.sh --service=cares-api-staging`（または `cares-web-staging`）
- staging の初回構築手順・AI キー差し替えは [`infra/scripts/README.md`](infra/scripts/README.md) の「staging 環境」節 / [`docs/OPERATIONS.md`](docs/OPERATIONS.md) §7.9。

### 「本番デプロイしてください」 → GCP 本番（必ず2ゲートを通す）

実体は [`infra/scripts/`](infra/scripts/README.md)（gcloud + docker buildx）。**順序厳守。テスト未 green か未承認なら絶対にデプロイしない**:

1. **テスト全実施ゲート（必須）**: `pnpm test`（+ `pnpm test:e2e`）を実行し**オールグリーン**を確認。1 件でも fail なら中断（skip は可）。
2. **承認ゲート（必須）**: デプロイ前に **GCP アカウント**（`gcloud config get-value account`）・**プロジェクト**（`gcloud config get-value project`）・**対象コミット**（`git log -1 --oneline` + 作業ツリーがクリーン/`origin/main` 同期か）を提示し、ユーザの明示承認（「デプロイ実行OK」）を得る。承認まで一切デプロイコマンドを実行しない。
3. 承認後: `05-migrate-prod.sh`（Prisma migrate 先行）→ `06`/`07` で api→web の 2 段デプロイ（`--api-url` 連携）→ 必要なら `--only=update-origin` / `08-update-identity-platform-domains.sh`。
4. デプロイ後: `gcloud run services logs read cares-api --region=asia-northeast1` と URL 疎通で確認。異常時は `99-rollback-cloud-run.sh`。
   - **CORS を必ず実測**（怠ると本番で `Failed to fetch` / `GCS PUT network error`。過去事故 → [`docs/incidents/2026-05-29`](docs/incidents/2026-05-29-prod-deploy-cors-failed-to-fetch.md)）:
     - ヘルスは **`/api/healthz`** が正本（`/healthz` は Cloud Run frontend が 404 で intercept する既知挙動）。
     - API: `curl -X OPTIONS <api>/api/quick-entry -H "Origin: <web>" -H "Access-Control-Request-Method: POST"` で `access-control-allow-origin` が返るか。欠ければ `07 --only=update-origin --web-url=<web>`。
     - GCS: `curl -X OPTIONS https://storage.googleapis.com/cares-photos-prod/x.jpg -H "Origin: <web>" -H "Access-Control-Request-Method: PUT"` で同上。欠ければ `08-update-identity-platform-domains.sh <web>`。
- GCP: project `arctic-anvil-497002-q2` / region `asia-northeast1` / account `yano@bresson.biz` / Cloud Run `cares-api`・`cares-web`。gcloud 未ログイン時は対話ログインをユーザに促す（自動実行しない）。破壊的スキーマ変更時は事前に `gcloud sql backups create --instance=cares-db-prod`。デプロイ系スクリプトは **Node 22** 必須（PATH 未設定だと `05-migrate-prod.sh` が engine エラー）。障害の調査記録は [`docs/incidents/`](docs/incidents/README.md)。

## 旧リポ参照

参考実装と旧 as-built ドキュメント: <https://github.com/agewaller/stock-screener>

## 開発体制

- オーナー: agewaller@gmail.com（管理者・最終決定者）
- 実装支援: Claude Code

## ステータス

フェーズ 5 機能移植中。記録 8 カテゴリ + 編集削除復元 + 監査ログ + AI 日次/深堀/レポート/研究 + 月次キャップ + 管理画面 FN-ADMIN-01〜07 + プロンプト DB-driven + 疾患選択 + **認証 Firebase Auth に切替 (ADR-0014)** + **お試し AI 分析 FN-TRIAL-01 (ADR-0016 / issue #27)** まで実装済。残作業は README の「フェーズ 5 残作業」を参照。
