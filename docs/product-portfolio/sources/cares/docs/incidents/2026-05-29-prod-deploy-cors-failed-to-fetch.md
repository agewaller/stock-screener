# 2026-05-29 本番デプロイ後の CORS 起因 `Failed to fetch` / `GCS PUT network error`

## TL;DR

本番に再デプロイした直後、ブラウザからの **書き込み系操作だけ**が失敗した。

- 「いますぐ記帳」の送信 → **`Failed to fetch`**
- 写真添付の送信 → **`GCS PUT network error`**

いずれも **CORS の許可 origin が欠けていた**のが原因。コードのバグではなく**デプロイ手順の
取りこぼし**。再デプロイで `07`/`08` の後工程をスキップしたために起きた。即時修正済み +
スクリプト/ドキュメントに恒久対策を入れた。

重要な切り分けポイント: **画面表示 (GET) は正常なのに POST/PUT だけ死ぬ**ときは、まず CORS を疑う。
SSR のページ読み込みはサーバ内 (`INTERNAL_API_URL` 経由・CORS 無関係) なので無傷、ブラウザから
直接叩く書き込みだけが CORS で落ちる、という非対称な壊れ方になる。

---

## 症状

- 本番 web `https://cares-web-xj6szhutkq-an.a.run.app` でログイン後、画面 (タイムライン等) は表示できる。
- トップの「いますぐ記帳」でテキストを送ると、ブラウザに `Failed to fetch`。
- 写真を添付して送ると `GCS PUT network error`。
- ローカル Docker 環境 (localhost:3000) では同じ操作が正常に動く。

---

## 調査の筋道

### 1. まず「どこで」落ちているかを API ログで見る

```sh
gcloud run services logs read cares-api --region=asia-northeast1 --limit=200 | grep -i quick-entry
# → OPTIONS 204 /api/quick-entry は出るが、POST /api/quick-entry が来ていない
```

`OPTIONS 204` (プリフライト) だけ記録され **POST が一切サーバに届いていない** →
「ブラウザがプリフライト応答を見て本リクエストを中止した」= **CORS でブロック**の典型。

### 2. プリフライト応答ヘッダを実測する

```sh
curl -sS -D - -o /dev/null -X OPTIONS https://cares-api-xj6szhutkq-an.a.run.app/api/quick-entry \
  -H "Origin: https://cares-web-xj6szhutkq-an.a.run.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" | grep -i access-control
```

結果に **`access-control-allow-origin` が無かった**。credentials 付き CORS でこれが無いと
ブラウザは本リクエストを送らない。→ API が「この origin は許可しない」と判断している。

### 3. API の `ALLOWED_ORIGINS` を確認

```sh
gcloud run services describe cares-api --region=asia-northeast1 \
  --format='json(spec.template.spec.containers[0].env)' \
  | python3 -c "import sys,json;[print(e['name'],'=',e.get('value')) for e in json.load(sys.stdin)['spec']['template']['spec']['containers'][0]['env'] if e['name']=='ALLOWED_ORIGINS']"
# → ALLOWED_ORIGINS = https://placeholder.example.com   ← これが原因
```

`https://placeholder.example.com` のまま = 実 web origin が許可されていない。
`curl` は CORS を強制しないので API 単体 (401 等) は動くが、**ブラウザだけが弾かれる**。

### 4. 写真 PUT (`GCS PUT network error`) は別レイヤの CORS

写真は `POST /api/photos/upload-url` で署名付き URL を得て、**ブラウザから
`storage.googleapis.com` に直接 PUT** する (API を経由しない)。エラー文言は
`apps/web/lib/photo-upload.ts` の `xhr.onerror` ("GCS PUT network error") で、CORS ブロック時に発火。

```sh
gcloud storage buckets describe gs://cares-photos-prod --format='json(cors_config)'
# → origin が ["https://cares-web-494881872429.asia-northeast1.run.app", ...] のみ
```

バケット CORS が許可していた origin は **プロジェクト番号形式**だけ。ブラウザの実 origin は
**ハッシュ形式** `https://cares-web-xj6szhutkq-an.a.run.app`。Cloud Run は同一サービスに
2 形式の URL を持つため、片方しか許可していないと PUT が落ちる。

---

## 根本原因

`infra/scripts/07-deploy-cloud-run.sh` の api/web デプロイは `--set-env-vars` で env を**総入れ替え**する。

- `--only=api` を `--web-url` 無しで実行すると `ALLOWED_ORIGINS=${WEB_URL:-https://placeholder.example.com}`
  により placeholder に戻る。
- 同様に `--only=web` 単独は `INTERNAL_API_URL` / `AUTH_URL` を placeholder に戻しうる。
- GCS バケット CORS は `08-update-identity-platform-domains.sh` が設定するが、これを実行しないと
  古い (または不足した) origin のまま。

今回は再デプロイ時に「サービス URL は不変だから」と `--only=update-origin` と `08` を
**不要と判断してスキップ**したため、両方の CORS が壊れた状態で本番に出てしまった。

---

## 対処 (即時 / 本番反映済み)

```sh
# 1) API の ALLOWED_ORIGINS を実 web URL に更新
bash infra/scripts/07-deploy-cloud-run.sh --only=update-origin \
  --web-url=https://cares-web-xj6szhutkq-an.a.run.app

# 2) GCS バケット CORS に web の両 URL 形式 + localhost を許可
#    (08 スクリプト、または cors-file を直接 update)
bash infra/scripts/08-update-identity-platform-domains.sh https://cares-web-xj6szhutkq-an.a.run.app
```

実測で回復を確認 (`access-control-allow-origin` が返る / GCS プリフライト 200)。

---

## 再発防止 (恒久 / コミット 933bf8f, 8d31cc4)

- `infra/scripts/_env.sh` に固定サービス URL `PROD_API_URL` / `PROD_WEB_URL` / `PROD_WEB_URL_ALT`
  を定義。`06`/`07` の placeholder 既定値をこれに差し替え → **`--api-url`/`--web-url` を省略した
  単独再デプロイでも origin/URL が維持される**。
- `08` の GCS CORS を `PROD_WEB_URL` + `PROD_WEB_URL_ALT` (2 URL 形式) + localhost の許可に。
- `infra/scripts/README.md` に「再デプロイ時の注意」と CORS 実測 curl を追記。

> サービスを作り直して run.app URL が変わったら `_env.sh` の `PROD_*_URL` を更新すること。

---

## 次回チェックリスト (デプロイ後に必ず実行)

```sh
API=https://cares-api-xj6szhutkq-an.a.run.app
WEB=https://cares-web-xj6szhutkq-an.a.run.app

# A. API ヘルス (正本は /api/healthz。/healthz は Cloud Run frontend が 404 で intercept する既知挙動)
curl -sS "$API/api/healthz"            # → {"status":"ok"}
curl -sS -o /dev/null -w "%{http_code}\n" "$WEB/"   # → 200

# B. API CORS プリフライト (access-control-allow-origin が web origin で返ること)
curl -sS -D - -o /dev/null -X OPTIONS "$API/api/quick-entry" \
  -H "Origin: $WEB" -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin

# C. GCS バケット CORS プリフライト (写真 PUT 用)
curl -sS -D - -o /dev/null -X OPTIONS "https://storage.googleapis.com/cares-photos-prod/x.jpg" \
  -H "Origin: $WEB" -H "Access-Control-Request-Method: PUT" | grep -i access-control-allow-origin
```

B か C で `access-control-allow-origin` が出なければ、`07 --only=update-origin` / `08` を実行する。

その他のデプロイ系の罠 (Node 22 PATH 必須など) は [`../../infra/scripts/README.md`](../../infra/scripts/README.md) を参照。
