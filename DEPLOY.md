# デプロイ手順

健康日記の本番 (`cares.advisers.jp`) とステージング (`staging.cares.advisers.jp`)
へのデプロイ運用マニュアル。

> アーキテクチャや禁則事項は `CLAUDE.md` を参照。ここでは「コード変更が
> どうやって本番に届くか」と「初回環境セットアップ」だけを扱う。

## 環境マトリクス

| 環境 | URL | Firebase | Worker | 駆動ブランチ | デプロイ手段 |
|------|-----|----------|--------|--------------|--------------|
| 本番 (production) | `cares.advisers.jp` | `care-14c31` | `stock-screener` (経由 `cares-relay`) | `main` | GitHub Pages + GitHub Actions |
| ステージング (staging) | `staging.cares.advisers.jp` | 別プロジェクト (Phase 3 で作成) | `stock-screener-staging` | `staging` | Cloudflare Pages + GitHub Actions |
| ローカル / プレビュー | `localhost`, `*.github.io` | デフォルト (本番と同じ) | デフォルト (本番と同じ) | 任意のブランチ | 手動 / ブランチ preview |

環境判定ロジックは `js/environment.js`。`location.hostname` だけで切替える。

## ブランチモデル

```
feature/foo ──→ PR ──→ staging ──→ 検証 ──→ PR ──→ main ──→ 本番
                          │                          │
                          ▼                          ▼
              staging.cares.advisers.jp     cares.advisers.jp
```

- 機能開発は feature ブランチで
- `staging` に merge してステージングで動作確認
- 問題なければ `staging` → `main` の PR で本番反映

`main` と `staging` の関係は **`staging` が常に `main` 以上**。`main` に
直接 commit すると差分が逆転するので避ける（ホットフィックスを除く、後述）。

## 日常デプロイフロー

### 1. 機能開発

```bash
git checkout staging
git pull origin staging
git checkout -b feature/my-change
# 編集...
git add -p
git commit -m "変更内容"
git push -u origin feature/my-change
```

### 2. ステージングへデプロイ

GitHub UI で **feature/my-change → staging** の PR を作成 → merge。

merge と同時に自動で:

- Cloudflare Pages が `staging.cares.advisers.jp` に静的サイトをデプロイ（〜1 分）
- GitHub Actions (`deploy-worker.yml`) が `stock-screener-staging` Worker をデプロイ
- 本番 Worker (`stock-screener`, `cares-relay`, `plaud-inbox` 等) は **デプロイされない**（`main` 限定にゲートしてある）

### 3. ステージングで検証

ブラウザを開いて `staging.cares.advisers.jp` でチェック:

- [ ] サイトが表示される（HTTP 200、画面が崩れていない）
- [ ] コンソールに JS エラーが出ていない
- [ ] ログイン画面が出る / 認証フローが通る（Firebase staging 設定済みの場合）
- [ ] AI チャットで Claude が応答する（staging Worker を経由している）
- [ ] 主要画面: ダッシュボード / 症状記録 / 設定 / 管理 (admin の場合)
- [ ] モバイル幅 (DevTools 375px) で崩れない
- [ ] 変更した機能のゴールデンパス + エッジケース
- [ ] **本番データを汚していない**（できれば別ブラウザプロファイルや
      シークレットウィンドウで検証）

検証のコツ:

- DevTools → Application → Local Storage で `firebase_config` と
  `anthropic_proxy_url` の中身を確認すれば、どの Firebase / Worker を
  叩いているか即わかる。
- Network タブで Anthropic リクエストの URL が
  `stock-screener-staging.agewaller.workers.dev` を指していれば OK。

### 4. 本番へ promote

問題なければ:

1. GitHub UI で **staging → main** の PR を作成
2. **Files changed** タブを開いて「本番に行く差分」を最終確認（誤って
   未テストの commit を main に流す事故をここで止める）
3. レビュー（自分一人でも構わない、ただし差分を一通り読む）
4. **Merge**（fast-forward でも squash でもよい。健康日記は squash 不要、
   通常の merge で履歴を残す方針）

merge と同時に自動で:

- GitHub Pages (`pages.yml`) が `cares.advisers.jp` をデプロイ（〜2 分）
- GitHub Actions が本番 Worker 群をデプロイ:
  - `stock-screener` (Anthropic プロキシ本体)
  - `cares-relay` (service binding 経由のフロント)
  - `plaud-inbox`, `professional-mailer`, `research-updater`, `learning-orchestrator`

### 5. 本番動作確認

`cares.advisers.jp` で「3. ステージングで検証」と同じチェックを軽く実行。
問題があれば即「ロールバック」へ。

## ホットフィックスフロー

本番障害でステージング経由する余裕がない場合のみ:

```bash
git checkout main
git pull origin main
git checkout -b hotfix/<short-name>
# 修正...
git push -u origin hotfix/<short-name>
```

GitHub UI で **hotfix/foo → main** の PR を作成 → 即 merge。

**事後処理（必須）**: `main` を `staging` に back-merge して、次の通常
リリースで自分の hotfix を踏まないようにする。

```bash
git checkout staging
git pull origin staging
git merge origin/main
git push origin staging
```

これを忘れると次の staging → main promote で「自分が直したはずの
問題」が staging に古いコードとして残り、本番に戻ってしまう。

## ロールバック手順

### 軽微な不具合（デプロイ直後に気づいた）

GitHub UI:

1. 問題の commit の PR ページを開く
2. 右上の **Revert** ボタン
3. 生成された Revert PR を `main` (or `staging`) に merge
4. 自動デプロイが走って前の状態に戻る（〜2 分）

### Worker が壊れた

Cloudflare ダッシュボード → Workers & Pages → 該当 Worker
(`stock-screener` / `cares-relay` 等) → **Deployments** タブ →
前のバージョンの右の "..." → **Rollback to this deployment**。

数十秒で前のバージョンに戻る。コード側の修正と並行して即時復旧できる。

### Firestore データの誤書き込み

Firestore は自動バックアップを取っていない。誤書き込みは個別に修正
するしかない:

- 管理パネル `/admin` の「データ管理」から該当ドキュメントを修正
- 大規模な場合は Firebase コンソール → Firestore で直接編集

将来的にはエクスポートのスケジュール設定を検討（`gcloud firestore export`
を Cloud Scheduler で定期実行）。

## 初回セットアップ（管理者向け、1 回だけ）

ステージング環境を立ち上げる時に管理者 (`agewaller@gmail.com`) が
手動で行う作業。

### 1. ブランチ作成

```bash
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

以降 `staging` ブランチは常に `main` 以上を保つ。

### 2. Cloudflare Pages プロジェクト

1. Cloudflare ダッシュボード → **Workers & Pages** → Create →
   **Pages** → **Connect to Git**
2. GitHub 連携を承認 → リポジトリ `agewaller/stock-screener` を選択
3. 設定:
   - Project name: `cares-staging-site` （または任意の名前）
   - Production branch: **`staging`**（**`main` ではない**、重要）
   - Build command: （空のまま）
   - Build output directory: `/`
   - Environment variables: なし
4. **Save and Deploy**
5. 初回デプロイが完了したら **Custom domains** タブ →
   **Set up a custom domain** → `staging.cares.advisers.jp`

### 3. DNS

`advisers.jp` の DNS で `staging.cares.advisers.jp` → CNAME →
`<project>.pages.dev`（Cloudflare Pages の Custom domains 画面が
指示する宛先）。

Cloudflare で `advisers.jp` を管理している場合は、Custom domain
設定が DNS レコードも自動で作る。`dig staging.cares.advisers.jp`
で 5 分以内に伝播することが多い。

### 4. Worker secret

Cloudflare ダッシュボード → Workers & Pages → **stock-screener-staging**
→ **Settings** → **Variables** → **Add variable**

- Type: **Secret**（"Encrypted" にチェック）
- Name: `ANTHROPIC_API_KEY`
- Value: 本番と別の Anthropic API key（本番キーを流用しても動くが、
  staging で使用量が混ざるので推奨は別キー）

設定後、`stock-screener-staging` の Deployments タブから最新の
deploy が動いていることを確認。

### 5. Firebase staging プロジェクト（Phase 3）

別タスクで詳細予定。完了したら次のいずれかで staging に config を反映:

- **コードに埋め込む（推奨）**: `js/environment.js` の `STAGING_FIREBASE`
  オブジェクトに apiKey 等を書き込む。git に乗るので Phase 3 完了時に
  PR で main までマージする
- **管理パネルから設定**: staging サイトの `/admin` → Firebase 設定で
  手動入力（localStorage に保存されるので、ブラウザを変えると消える）

Phase 3 が完了するまで staging サイトでログインフローは動かない
（Firebase 設定が空のため `FirebaseBackend.isConfigured()` が false）。
UI 表示の確認のみ可能。

### 6. 動作確認

すべて完了したら次を確認:

- [ ] `https://staging.cares.advisers.jp` が表示される
- [ ] DevTools → Network で `cares-relay.agewaller.workers.dev` を
      叩いていない（staging Worker を指しているはず）
- [ ] DevTools → Console で `Environment.current === 'staging'`

## トラブルシューティング

### staging.cares.advisers.jp が 404 / SSL エラー

- Cloudflare Pages → Deployments タブで最新 deploy が **Success** か確認
- Custom domains タブで `staging.cares.advisers.jp` が **Active** か
- DNS 伝播待ち: `dig staging.cares.advisers.jp` で CNAME が返るか確認
- SSL 証明書発行待ち: Custom domain 設定後 5〜30 分かかる場合あり

### Worker が 401 / 502 を返す

- `stock-screener-staging` の Settings → Variables で
  `ANTHROPIC_API_KEY` が設定されているか
- Worker の **Logs** タブ（リアルタイム）でリクエストとエラーを確認
- `curl -is https://stock-screener-staging.agewaller.workers.dev/` で
  Worker 自体が生きているか確認

### 「Firebase 未設定です」と出る

Phase 3（Firebase staging プロジェクト作成）が未完了。`js/environment.js`
の `STAGING_FIREBASE.apiKey` が空のため起きる正常な状態。Phase 3 完了
まで待つこと。

### staging で本番 Firestore に書き込んでしまった

`js/environment.js` の `STAGING_FIREBASE` が空のままだと
`Environment.firebaseConfig()` が `null` を返し、`getConfig()` が
`CONFIG.FIREBASE`（本番）にフォールバックする仕様。

**Phase 3 完了前はデータ書き込みを伴う検証をしない**こと。書き込んで
しまった場合は管理パネルで該当ドキュメントを削除/修正。

### staging push したのに Cloudflare Pages がデプロイしない

- Cloudflare Pages の Settings → Builds & deployments で
  Production branch が `staging` になっているか
- リポジトリ連携が切れていないか（Settings → Source）

### main にしか反映したくない変更を staging に混ぜたくない

`staging` を一旦 `main` に揃え直す:

```bash
git checkout staging
git reset --hard origin/main
git push --force-with-lease origin staging
```

ただし `--force-with-lease` は staging だけにすること。**main で
やってはいけない**。

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `.github/workflows/pages.yml` | `main` push で GitHub Pages へデプロイ |
| `.github/workflows/deploy-worker.yml` | `main` / `staging` push で Worker デプロイ（ジョブ単位で `if` ゲート） |
| `wrangler.jsonc` | 本番 Worker (`stock-screener`) 設定 |
| `wrangler.staging.jsonc` | ステージング Worker (`stock-screener-staging`) 設定 |
| `wrangler.relay.jsonc` | `cares-relay`（本番のみ） |
| `js/environment.js` | hostname で環境判定 |
| `CNAME` | 本番カスタムドメイン (`cares.advisers.jp`)。staging はファイル不要（Cloudflare Pages 側で管理） |
