# 2026-06-09 staging で記帳が 500 / 画面に「... is not valid JSON」

## TL;DR

staging で記帳しようとすると `Unexpected token 'I', "Internal S"... is not valid JSON`
が表示された。原因は **Cloud Run に `DATA_ENCRYPTION_KEY` が未配線**で、本文の AES-GCM
暗号化が `DATA_ENCRYPTION_KEY is not set` で throw → API が 500 (`Internal Server Error`
プレーンテキスト) → フロントがそれを `res.json()` して parse 失敗、という連鎖。
secret を作成して `cares-api-staging` に配線して復旧。同じ欠落は prod にもあったため
prod にも鍵を配線した (コードデプロイは未実施)。恒久対策として `01`/`07` スクリプトと
docs に鍵を組み込んだ。

## 症状

- 操作: <https://stg-cares.advisers.jp/timeline> で「いますぐ記帳」→ 送信
- 画面: `Unexpected token 'I', "Internal S"... is not valid JSON`
- ドラフト自動保存 (`PUT /api/drafts/quick-post`) も 500

## 調査の筋道

```sh
# 1. staging API ログを確認 → 暗号化鍵が無いという明確なエラー
gcloud run services logs read cares-api-staging --region=asia-northeast1 \
  | grep -iE "error|500"
# → POST 500 /api/quick-entry
# → Error: DATA_ENCRYPTION_KEY is not set. ... at encryptField (packages/db/src/encryption.ts)

# 2. デプロイスクリプトの secret 配線を確認 → そもそも鍵が無い
grep -n "set-secrets" infra/scripts/07-deploy-cloud-run.sh   # DATA_ENCRYPTION_KEY が無い
grep -n "DATA_ENCRYPTION_KEY" infra/scripts/01-create-secrets.sh  # 作成すらしていない

# 3. 実サービスの env / secret 一覧でも欠落を確認 (prod も同様に欠落)
gcloud run services describe cares-api-staging --region=asia-northeast1 \
  --format='yaml(spec.template.spec.containers[0].env)'
gcloud secrets list --filter="name~cares-"   # cares-data-encryption-key(-staging) が無い
```

フロント側 (`apps/web/components/QuickPost.tsx`) が `res.ok` を確認する前に
`await res.json()` していたため、500 の非 JSON 本文で parse 例外になり、ユーザに
「JSON エラー」という分かりにくいメッセージが出ていた (本質ではないが症状を悪化させた)。

## 根本原因

- アプリ層フィールド暗号化 (詳細設計書 §2 / `packages/db/src/encryption.ts`) は
  `text_entries.content` 等を暗号化する。鍵 `DATA_ENCRYPTION_KEY` は **必須**で、
  未設定だと `getMasterKey()` が throw する。
- `.env.example` と詳細設計書には「本番/staging は Secret Manager に保管し Cloud Run に
  注入」と書いてあったが、**`infra/scripts/` がその secret を作成も配線もしていなかった**
  (01 は 6 secret しか作らず、07 の `--set-secrets` にも無かった)。ドキュメントと実装の乖離。
- ローカル Docker (`docker-compose.yml`) は鍵をデフォルト値で渡していたため、ローカルでは
  記帳が動き、欠落が prod/staging まで気づかれなかった。

## 対処 (即時)

```sh
# staging: secret 作成 + staging SA に accessor + サービスへ配線
gcloud secrets create cares-data-encryption-key-staging --replication-policy=automatic
openssl rand -hex 32 | tr -d '\n' | gcloud secrets versions add cares-data-encryption-key-staging --data-file=-
gcloud secrets add-iam-policy-binding cares-data-encryption-key-staging \
  --member="serviceAccount:cares-run-staging@arctic-anvil-497002-q2.iam.gserviceaccount.com" \
  --role=roles/secretmanager.secretAccessor
gcloud run services update cares-api-staging --region=asia-northeast1 \
  --update-secrets="DATA_ENCRYPTION_KEY=cares-data-encryption-key-staging:latest"

# prod も同じ欠落 → 同様に作成 + 配線 (SA は cares-firebase-admin@...)。コードデプロイは未実施。
```

> 新規鍵で安全な理由: 鍵未設定下では暗号化が一度も成功しておらず、別鍵で暗号化された
> 既存データが存在しない。よって新規生成しても復号不能データは発生しない。
> **逆に、一度運用を始めた鍵の値は絶対に差し替えない** (既存暗号化データが復号不能になる)。

## 再発防止 (恒久)

- `infra/scripts/01-create-secrets.sh`: `cares-data-encryption-key` を作成 (無ければ
  `openssl rand -hex 32` で自動生成)。7 secret に。
- `infra/scripts/07-deploy-cloud-run.sh`: api の `--set-secrets` に
  `DATA_ENCRYPTION_KEY=${SECRET_DATA_ENCRYPTION_KEY}:latest` を追加。
  ※ `--set-secrets` は総入れ替えなので、ここに無いと再デプロイで鍵が消える
  (CORS の `ALLOWED_ORIGINS` placeholder 事故と同じクラス)。
- `infra/scripts/_env.sh` / `_env.staging.sh`: `SECRET_DATA_ENCRYPTION_KEY` を定義。
- フロント `apps/web/components/QuickPost.tsx`: `res.json()` 直叩きをやめ、
  `res.text()` → 安全に JSON parse。非 JSON / 5xx でも分かるメッセージを表示。
- docs: OPERATIONS §6 トラブルシュート行 / prod・staging リソース表 / `.env` 例、
  ADR-0015 secret 表、infra README に鍵を反映。

## 次回チェックリスト

- [ ] 新しい暗号化対象フィールド/環境を足すときは、`01` で secret 作成・`07` で配線・
      ローカル `docker-compose.yml` の 3 箇所すべてに鍵が通っているか確認する。
- [ ] Cloud Run に env/secret を足すスクリプトは `--set-secrets` (総入れ替え) か
      `--update-secrets` (追加) かを意識する。デプロイ経路では前者なので**全 secret を列挙**。
- [ ] デプロイ後に記帳を 1 回実測する (CORS と同じく「動く経路」を必ず叩く)。

## 関連

- 同日の別修正 (コード defect): 記帳直後の AI「ひとこと」が写真添付時も画像を
  モデルへ渡しておらず「写真が見えない」と返していた件を `quick-entry` で画像同梱に修正
  (回帰テスト追加)。本 incident の暗号化鍵問題とは独立。
