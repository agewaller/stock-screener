# 2026-06-01 本番 CORS allowlist にプロジェクト番号形式 URL が欠けて `Failed to fetch` 再発

## TL;DR

本番 web をプロジェクト番号形式 URL
`https://cares-web-494881872429.asia-northeast1.run.app` で開いたユーザーの**書き込み系操作
だけ**が `Failed to fetch` で多発した。

- 原因は [2026-05-29 の incident](2026-05-29-prod-deploy-cors-failed-to-fetch.md) と**同じクラス**
  (CORS 許可 origin の欠落) だが**取り残し箇所が違う**。
- 前回 GCS バケット CORS は 2 形式 (ハッシュ形式 + プロジェクト番号形式) を許可するよう直したが、
  **API の `ALLOWED_ORIGINS` は片方 (ハッシュ形式) のままだった**。
- Cloud Run は 1 サービスに 2 形式の URL を持つ。番号形式 URL でアクセスしたブラウザの Origin が
  API allowlist に無く、プリフライトに `access-control-allow-origin` が返らず本リクエストが中止された。

## 切り分け（実測）

```sh
API=https://cares-api-xj6szhutkq-an.a.run.app
WEB=https://cares-web-xj6szhutkq-an.a.run.app            # ハッシュ形式
WEB_ALT=https://cares-web-494881872429.asia-northeast1.run.app  # プロジェクト番号形式

# ハッシュ形式 → access-control-allow-origin 返る ✅
curl -sS -D - -o /dev/null -X OPTIONS "$API/api/quick-entry" \
  -H "Origin: $WEB" -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin

# 番号形式 → access-control-allow-origin 欠落 ❌ (これが症状)
curl -sS -D - -o /dev/null -X OPTIONS "$API/api/quick-entry" \
  -H "Origin: $WEB_ALT" -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin
```

本番 API の env は `ALLOWED_ORIGINS = https://cares-web-xj6szhutkq-an.a.run.app` の 1 形式のみだった。
`apps/api/src/index.ts` の CORS は `ALLOWED_ORIGINS.includes(origin)` の**完全一致**なので、番号形式
origin は `null` (拒否) になる。

> GET (画面表示) は SSR がサーバ内 (`INTERNAL_API_URL`) で叩くため CORS 無関係 → 無傷。ブラウザから
> 直接叩く POST/PUT だけが落ちる、という前回と同じ非対称な壊れ方。

## 根本原因

`infra/scripts/07-deploy-cloud-run.sh` が `ALLOWED_ORIGINS` に web URL を**1 つしか入れていなかった**
(`ALLOWED_ORIGINS=${WEB_URL:-$PROD_WEB_URL}`)。GCS バケット CORS (script 08) は前回修正で 2 形式を
許可するようになったが、API allowlist の同等修正が漏れていた。

## 対処（即時 / 本番反映済み）

```sh
bash infra/scripts/07-deploy-cloud-run.sh --only=update-origin
# → ALLOWED_ORIGINS=<ハッシュ形式>,<プロジェクト番号形式> に更新。新リビジョン cares-api-00009-z6w。
```

実測で両形式とも `access-control-allow-origin` が返ることを確認。

## 再発防止（恒久）

- `infra/scripts/_env.sh` に `PROD_ALLOWED_ORIGINS=$PROD_WEB_URL,$PROD_WEB_URL_ALT` を一元定義
  (2 形式をまとめて管理)。
- `07-deploy-cloud-run.sh` の api デプロイと `update-origin` の両方でこれを使用。`ALLOWED_ORIGINS` の
  値がカンマを含むため、gcloud `--set-env-vars` / `--update-env-vars` の区切り文字を `^|^` に変更。
- これで `--only=api` 単独再デプロイでも 2 形式が常に維持される。

> サービスを作り直して run.app URL が変わったら `_env.sh` の `PROD_*_URL`
> (および必要なら `PROD_ALLOWED_ORIGINS`) を更新すること。

## チェックリスト

デプロイ後の CORS 実測 (B/B2/C) は前回 incident の「次回チェックリスト」に従う。**API は必ず 2 形式
(ハッシュ形式 + プロジェクト番号形式) の両 Origin で** preflight を確認する。
