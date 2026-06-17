# 2026-06-16 staging で「ログインの有効期限が切れました。再ログインを」誤表示

## TL;DR

staging で記帳しようとすると **「ログインの有効期限が切れました。お手数ですが一度
ログアウトして再度ログインしてください。」** が表示された。原因は **staging の
Cloud SQL (`cares-db-staging`) が停止中**で、API が認証後の `prisma.user.upsert`
(DB 書き込み) に失敗 → それを `verifyIdToken` 失敗と**同じ `catch` が拾って 401
`invalid_token`** にまとめ → フロントが 401 を「トークン期限切れ」と解釈して再ログインを
誤誘導、という連鎖。トークン自体は正常だった。DB を起動して即時復旧。誤判定の温床に
なった `deploy-staging` の SQL 自動停止 (`if: always()`) と、API の 401/DB 障害の
混同を恒久対策した。

## 症状

- 操作: <https://stg-cares.advisers.jp> でログイン済みのまま「いますぐ記帳」→ 送信
- 画面: 「ログインの有効期限が切れました。お手数ですが一度ログアウトして再度
  ログインしてください。」
- 再ログインしても解消しない (トークンは新鮮なため当然)。

## 調査の筋道

```sh
# 1. メッセージの出所をコードから特定 → 401 後に出る固定文言
grep -rn "ログインの有効期限" apps/web   # QuickPost.tsx:187 (postEntry が 401 のとき throw)
#    クライアントは getCurrentIdToken(true) で強制更新して 1 回再試行済み。
#    それでも 401 = サーバが新鮮なトークンを弾いている。

# 2. API の認証検証を確認 → verify と DB upsert が同じ try/catch
#    apps/api/src/index.ts: verifyIdToken 成功後の prisma.user.upsert 失敗も
#    まとめて catch → return invalid_token 401。DB 障害が 401 に化ける構造。

# 3. staging の Cloud SQL 状態を確認 → 停止していた
gcloud sql instances describe cares-db-staging --project=arctic-anvil-497002-q2 \
  --format='value(state, settings.activationPolicy)'
# → STOPPED  NEVER

# 4. API ログでも 401 を確認
gcloud run services logs read cares-api-staging --region=asia-northeast1 \
  --project=arctic-anvil-497002-q2 --limit=60 | grep quick-entry
# → POST 401 .../api/quick-entry (複数回)
```

## 根本原因

- **直接原因**: staging の Cloud SQL が `STOPPED` (`activationPolicy=NEVER`)。
  DB に届かず `prisma.user.upsert` が throw していた。
- **誤メッセージの原因 (コード defect)**: 認証ミドルウェア (`apps/api/src/index.ts`)
  が `verifyIdToken` と `prisma.user.upsert` を**同一 `try` で包み、`catch` で一律
  `invalid_token` 401** を返していた。さらに `await next()` も同じ `try` 内にあり、
  下流ハンドラの例外まで 401 に化けうる潜在バグもあった。トークンは正常なのに
  フロントは 401 を「期限切れ→再ログイン」と解釈するため、症状が誤誘導になった。
- **DB が止まった引き金 (CI defect)**: `deploy-staging.yml` 末尾の
  `Stop Cloud SQL (staging) — always` が `if: always()`。直前の手動実行が
  `Migrate staging DB` で失敗 (cloud-sql-proxy のバージョン 404、別 incident 相当) した際、
  **失敗時でも停止ステップが走って DB を止めた**。「staging SQL は当面稼働しっぱなし」
  という運用方針 (ADR-0015 / メモリ) と workflow が不整合だった。

## 対処 (即時)

```sh
# staging Cloud SQL を起動し RUNNABLE まで待機 (account/project 確認の上)
gcloud sql instances patch cares-db-staging --project=arctic-anvil-497002-q2 \
  --activation-policy=ALWAYS --quiet
# state が RUNNABLE になるまでポーリング

# 復旧確認
curl -fsS https://cares-api-staging-xj6szhutkq-an.a.run.app/api/healthz   # {"status":"ok"}
# トークン無し POST は 401 unauthorized (= 認証ヘッダ無しの正常応答。DB 由来の偽 401 ではない)
```

## 再発防止 (恒久)

- **API `apps/api/src/index.ts`** (commit `f9224ec`):
  - `verifyIdToken` (→401 `invalid_token`) と `prisma.user.upsert` (→DB 障害は
    503 `service_unavailable`「一時的にサーバへ接続できません」) を**別 try/catch に分離**。
    DB 到達不可をトークン無効と混同しない。
  - `await next()` を catch の外へ出し、下流ハンドラの例外を 401/503 に化けさせない。
  - ※ コード変更のため**有効化には staging/prod の再デプロイが必要**。
- **CI `.github/workflows/deploy-staging.yml`** (同 commit):
  - SQL 停止ステップを `if: ${{ always() && inputs.stop_sql_after }}` に変更。
    新規入力 `stop_sql_after` の既定は `false` なので、**既定では停止しない**
    (チーム検証中は稼働しっぱなし運用と整合)。明示的に停止したいときだけ
    `stop_sql_after=true` で dispatch する。

## 次回チェックリスト

- [ ] staging サイトで認証系が突然 401 / 「再ログインを」になったら、**まず
      `cares-db-staging` の state を疑う** (`gcloud sql instances describe ... --format='value(state)'`)。
      `STOPPED` なら `--activation-policy=ALWAYS` で起動。
- [ ] `deploy-staging` を回した直後にサイトが落ちたら、ランの
      `Stop Cloud SQL` ステップが走っていないか確認 (失敗ランでも `always()` 系は走る)。
      検証中に止めたくないときは `stop_sql_after` を `false` のままにする。
- [ ] 認証ミドルウェアに DB アクセスを足すときは、DB 障害が 401 (トークン無効) に
      丸まらないよう `verifyIdToken` とは別の try/catch にして 5xx を返す。

## 関連

- 同日: `deploy-staging` の `Migrate staging DB` 失敗 (cloud-sql-proxy `v2.13.1` が
  GCS から削除され 404、404 XML 本文をバイナリ実行して syntax error → P1001) を
  `v2.22.1` にピン更新して修正 (commit `8bb77d2`)。この migrate 失敗ランの末尾停止が
  本 incident の DB 停止の引き金になった。
- 関連メモリ: 「staging SQL は当面稼働しっぱなし運用 (チーム動作チェック中、勝手に止めない)」。
