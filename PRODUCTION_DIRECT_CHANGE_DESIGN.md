# 本番環境を直接変更できる運用設計

## 目的
- 緊急時に「コードを main に push する通常フロー」を待たずに、本番反映を即時実行できるようにする。
- ただし完全な手動運用ではなく、**GitHub Actions 上に監査ログを残す**。

## 追加した仕組み
- `.github/workflows/direct-prod-deploy.yml` を追加。
- GitHub Actions の `workflow_dispatch` から、次の 3 パターンを手動実行可能。
  - `frontend`: GitHub Pages のみ更新
  - `worker`: Cloudflare Worker のみ更新
  - `all`: フロント + Worker 同時更新
- 反映対象 `ref`（branch / tag / commit SHA）を手入力で指定可能。

## 期待する運用フロー

### 1) 緊急ホットフィックス（最短）
1. GitHub Web UI で `main` を直接編集（または事前作成済み hotfix commit を使用）。
2. Actions > **Direct Production Deploy** を開く。
3. `target` と `ref` を指定して実行。
4. 実行ログを運用記録に貼り付け。

### 2) Worker だけ即時反映したい場合
1. `worker/anthropic-proxy.js` の変更 commit を作成。
2. **Direct Production Deploy** で `target=worker`、`ref=<commit sha>` を指定。

## 権限設計（推奨）
- GitHub: `Direct Production Deploy` 実行権限は運用担当者のみに限定。
- GitHub Environment (`github-pages`): 必要なら Required reviewers を有効化。
- Cloudflare API Token: Worker deploy に必要な最小権限のみ付与。

## 監査・ロールバック設計
- 監査: すべて GitHub Actions の実行履歴に残る。
- ロールバック: 直前の安定 commit SHA を `ref` に指定して再実行するだけで復旧可能。

## 注意点
- 「本番を直接触れる」= 誤反映リスクも増えるため、最低限以下は必須。
  - 実行者の限定
  - 実行履歴の記録
  - ロールバック SHA の事前共有
