# 障害記録 / Runbook (incidents)

本番・テスト環境で発生した障害の **症状 → 原因調査 → 対処 → 再発防止** を時系列で残す。
次に同じ症状を見たとき、ここを最初に引く。新しい障害は 1 件 1 ファイル
(`YYYY-MM-DD-<slug>.md`) で追加し、この索引に 1 行足す。

> クイックな「症状→対処」一覧は [`../OPERATIONS.md` §6 トラブルシューティング](../OPERATIONS.md#6-トラブルシューティング)。
> ここはその深掘り版 (調査の筋道と恒久対策まで) を置く場所。

## 索引

| 日付 | 症状 (ユーザに見えるもの) | 根本原因 | 記録 |
|---|---|---|---|
| 2026-05-29 | 本番で「いますぐ記帳」が `Failed to fetch` / 写真添付が `GCS PUT network error` | 再デプロイで CORS 許可 origin が欠落 (API の `ALLOWED_ORIGINS` が placeholder / GCS bucket CORS に web origin 不足) | [2026-05-29-prod-deploy-cors-failed-to-fetch.md](2026-05-29-prod-deploy-cors-failed-to-fetch.md) |
| 2026-06-01 | 本番でプロジェクト番号形式 URL からの書き込みが `Failed to fetch` 多発 | API の `ALLOWED_ORIGINS` がハッシュ形式 1 つだけで、Cloud Run のもう一方 (プロジェクト番号形式) URL の Origin を拒否 | [2026-06-01-prod-cors-allowlist-missing-alt-url.md](2026-06-01-prod-cors-allowlist-missing-alt-url.md) |
| 2026-06-09 | staging で記帳が `Internal Server Error` / 画面に `... is not valid JSON` | Cloud Run に `DATA_ENCRYPTION_KEY` が未配線で本文の暗号化が throw → 500 (`01`/`07` スクリプトが鍵を作成・配線していなかった) | [2026-06-09-staging-quick-entry-data-encryption-key-missing.md](2026-06-09-staging-quick-entry-data-encryption-key-missing.md) |
| 2026-06-16 | staging で「ログインの有効期限が切れました。再ログインを」誤表示 (再ログインしても解消せず) | staging Cloud SQL が停止中で `prisma.user.upsert` が失敗 → API が `verifyIdToken` 失敗と同じ catch で 401 `invalid_token` に丸めていた。停止の引き金は `deploy-staging` の `if: always()` SQL 停止が migrate 失敗時にも走ったこと | [2026-06-16-staging-login-expired-sql-stopped.md](2026-06-16-staging-login-expired-sql-stopped.md) |

## 書き方テンプレ

新規ファイルは次の見出しで揃える:

1. **TL;DR** — 1〜2 行で症状と原因と対処
2. **症状** — ユーザ/ブラウザに見えた事象、再現操作
3. **調査の筋道** — 何をどの順で確認して切り分けたか (コマンド込み)
4. **根本原因**
5. **対処 (即時)** — 本番に何をしたか
6. **再発防止 (恒久)** — コード/スクリプト/ドキュメントに入れた変更
7. **次回チェックリスト** — 同じ轍を踏まないための確認手順
