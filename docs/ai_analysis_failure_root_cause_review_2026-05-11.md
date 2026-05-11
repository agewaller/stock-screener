# AI 解析失敗インシデント 根本原因レビュー

- 作成日: 2026-05-11
- スコープ: 2026-04-20 〜 2026-05-10 にかけて発生した「AI が動かない / 接続できませんでした / 永遠にエラー」報告群
- 関連 PR: #31, #32, #33, #34, #35, #36, #37, #38, #40, #41, #42, #43, #44, #45, #46, #47
- 関連 Worker: `stock-screener`, `cares-ai-proxy`, `cares-relay`

## 1. 結論（TL;DR）

ユーザーから見えた症状は **「AI 応答が出ない」** という 1 つだけだったが、内部的には **少なくとも 5 つの独立した障害** が時間差で重なって発生していた。それぞれ別の層・別のオーナーで起きていたため、症状から原因への切り分けに 3 週間を費やした。

| # | 真の原因 | 顕在化した症状 | 解消 PR |
|---|---------|---------------|---------|
| 1 | PR #31 で全ユーザーを Worker 経由に強制したが、Worker 側 `env.ANTHROPIC_API_KEY` 未設定 | 「APIキーが未設定です」 | #34 |
| 2 | 旧 PWA Service Worker (`/sw.js`) が cache-first でデプロイ済の旧 JS を返し続けた | 修正を push しても「永遠にエラー」 | #32 |
| 3 | `deploy-worker.yml` が 20 日間 9 連続失敗（`accountId` パラメータ不足）→ Worker 側修正が一切デプロイされていなかった | 「コミットしたのに直らない」 | #44, #45 |
| 4 | Cloudflare Access (Zero Trust) が `stock-screener` Worker を保護 → ブラウザ fetch が認証画面にリダイレクト → CORS で fail | 「Load failed」 | #43 (`cares-relay` 経由) |
| 5 | Cloudflare アカウントの `workers_dev` サブドメインが account-level で無効化 → 全 `*.agewaller.workers.dev` が `403 / x-deny-reason: host_not_allowed` | 「接続できませんでした」 | #47 (検知 + 修復 workflow) |

これらは **同時並行で進行していた** ため、修正 A の後に症状 B が出て、B を直したら C が出る、という形で延々と「直っていない」状態が続いた。

## 2. インシデント時系列（要約）

```
2026-04-20  PR #21    全コレクションを Firestore に同期（健全）
2026-04-22  PR #31    全ユーザーを Worker 経由に強制 ← ここから第 1 波
            ↓        Worker の env.ANTHROPIC_API_KEY が空のままだったため
            ↓        全ユーザーが「APIキーが未設定です」になる
2026-05-06  PR #34    HOTFIX: 強制を撤回（キーあれば direct、無ければ Worker）
2026-05-08  PR #32    旧 PWA Service Worker を unregister
                      → 第 2 波（cache 起因の「永遠にエラー」）の根治
2026-05-10  PR #38    Cloudflare Access 保護に気付き Worker を rename
2026-05-10  PR #42    rename を撤回（admin が Access App は無いと確認）
2026-05-10  PR #43    cares-relay Worker (service binding) で Access バイパス
2026-05-10  PR #44    deploy-worker.yml の accountId 不足を発見 → 20 日分の
                      Worker 修正が全部空振りだったことが判明
2026-05-10  PR #47    workers.dev account-level 無効化を検知
                      → workflow_dispatch で自動再有効化を試行
```

## 3. 各層の根本原因

### 3.1 アプリ層: 「キーが無ければ Worker」設計の単一障害点

PR #31 は **キーの有無に関わらず全リクエストを Worker にルーティング** する形に変えた。これにより:

- Worker の `env.ANTHROPIC_API_KEY` が単一障害点になった
- 環境変数の設定漏れがそのまま全ユーザーの全機能停止に直結
- ユーザー側 API キーを保持しているユーザーまで一緒に巻き添えになった

**学び**: クライアント鍵があるなら `api.anthropic.com` に直接、無ければ Worker、という二系統ルーティングを維持する（現状の `getAnthropicEndpoint(hasKey)` に戻った）。

### 3.2 PWA 層: 寿命の長い Service Worker

過去ビルド（a9d314a, cf528a4, 738fcd1）で `/sw.js` を cache-first で登録していた。後から PWA をやめても、**登録済 SW は user agent 側に残り続ける**ため、影響を受けたユーザーは何度 deploy しても旧 HTML/JS を見続ける。これが「永遠にエラー」の正体。

**学び**: PWA / SW を一度でも登録した過去があるなら、現行 HTML の先頭で `navigator.serviceWorker.getRegistrations()` をまわして無条件に unregister する unregister-on-load を常設する（index.html:1644 以降に追加済）。

### 3.3 CI 層: 静かに死んでいた `deploy-worker.yml`

`cloudflare/wrangler-action@v3` は `accountId` パラメータ必須だが指定が無く、**直近 20 日間 9 連続失敗**。GitHub Actions の失敗通知を admin がモバイルでは見ていなかったため、「コミット = デプロイ済」という前提が破綻していたのに気付かなかった。

その結果、PR #28〜#31 で行った Worker 側のロジック修正（CORS ヘッダ追加、エラー JSON 整形など）は **一度も本番に到達していない**。原因切り分けで「Worker 側の修正が効かない」と何度も観測したのはこのため。

**学び**:
- `deploy-worker.yml` 単体での失敗を Slack / メール通知に流す（現状: 通知なし）
- 「deploy が成功した」と「Worker が応答する」を別物として probe する。マージ後に `curl -fsS https://<worker>/health` を後段ジョブとして必ず実行する（`deploy-relay.yml` には実装済、`deploy-worker.yml` は未実装）

### 3.4 Cloudflare Access 層: 顕在化していなかったゾーン設定

PR #38 時点では admin の Safari が `stock-screener.agewaller.workers.dev` を叩くと `agewaller.cloudflareaccess.com` の認証画面に飛ばされていたことから、Access App による保護だと判断。しかし PR #42 で admin が「Access Application は管理画面に存在しない」と確認したため、ここで仮説が崩れた。

最終的に PR #43 の `cares-relay` Worker（service binding 経由で `stock-screener` を内部呼び出し）で **public 層の制限を一括で迂回する** 方式に着地した。これは Access が後で再発したり、Bot Fight / Rate Limiting / WAF が追加で被さってきても影響を受けないため、設計としては正しい。

**学び**: 認証ゲート（Access / WAF / Bot Management）が「いつの間にか有効化されている」ケースは Cloudflare では珍しくない。public URL を直接叩く構成より、**service binding で内部呼び出しする relay を 1 段噛ませる構成**を標準にしておくほうが堅牢。

### 3.5 アカウント層: `workers_dev` サブドメインの無効化

PR #47 の診断で、**全 `*.agewaller.workers.dev` URL が `403 / x-deny-reason: host_not_allowed` / レスポンスボディ "Host not in allowlist"** を返していることが判明。これは Cloudflare アカウントの `workers_dev` 設定が account-level で無効化されたときに、エッジが Worker コードを呼ばずに直接返す仕様。Worker 側の修正では絶対に対応できない。

原因は Zero Trust 未契約のため Access ポリシーではなく、Cloudflare 側で何らかの自動ポリシー（無料プランの何らかの制限 / セキュリティアクション）が走った可能性が高い。`cloudflare-workers-diag.yml` workflow が:

1. 各 Worker の到達性プローブ
2. account API で `subdomain.enabled` 状態確認
3. `POST /accounts/{id}/workers/subdomain { enabled: true }` で再有効化

を実行することで、admin がモバイルから 1 タップで復旧できるようにした。

**学び**: workers.dev サブドメインに依存しないルーティングを将来的に検討（custom domain `proxy.advisers.jp` を Worker route として割り当てる）。

### 3.6 クライアント側エラー UX

「Load failed」「Failed to fetch」という TypeError は **fetch 自体が成立しなかった** ことを示すが、原因として:

- in-app browser（FB, IG, LINE, X）のクロスオリジンブロック
- CORS preflight 失敗
- DNS 不到達
- workers.dev account-level disable
- Service Worker キャッシュ
- ローカルネットワーク制限

の **全て** が同じメッセージで顕在化する。ユーザーには区別不可能だった。

現状 `index.html` の callClaude は `x-deny-reason: host_not_allowed` 検出と in-app browser 検出を実装済（`index.html:2186-2200`）。さらに `err.diag` に raw fetch URL, error name, UA を埋めてエラー UI からコピーできるようにした。

**学び**: 「Load failed」のような曖昧エラーを見たら **まず admin が再現できる診断情報を吐く**。問い合わせベースで原因を当てに行くより、ボタン 1 つで `/diagnostic` レポートをクリップボードに入れさせる。

## 4. システミックな反省

### 4.1 「Worker さえデプロイすれば直る」前提に頼りすぎた

Worker のソース修正で 5 回ぐらい push したが、**実際には 1 回もデプロイされていなかった**（§3.3）。CI 失敗を見ない運用では、「コミット = デプロイ」は成立しない。マージ後に必ず本番 probe する後段ジョブを CI 側で強制する。

### 4.2 仮説の切り替えコストが高すぎた

「Access 保護」「SW キャッシュ」「Worker 名 rename」を順番に試したが、**実際の根因は CI 不動 + account-level workers.dev disable** だった。仮説ごとに deploy 1 サイクル（数分）を費やしてしまった。

対策: **症状を 1 つに絞らず、客観的に切り分けられる probe を最初に流す**。`cloudflare-workers-diag.yml` を最初から持っていれば、PR #38 を打つ前に「workers.dev サブドメイン無効」を即特定できていた。

### 4.3 モバイル admin の制約

admin が iPhone のみで運用しているため:

- Cloudflare ダッシュボードでの細かい設定変更が困難
- GitHub Actions の失敗通知を見落とす
- Firebase Console の Firestore Rules デプロイが困難（→ PR #46 で OAuth 経由 1-tap 化）
- `wrangler secret put` を打てない

これに対し、自動化 / 1-tap ボタン化が後追いで PR #41, #43, #46, #47 で追加された。**新機能を入れるときに「モバイル admin で何タップで復旧できるか」を最初から考慮する**ようにする。

### 4.4 ユーザー対応のスピードと品質

クレームが「殺到中」となるまで顕在化に時間がかかった。ユーザーが「動かない」と気付いてから admin に届くまでにラグがあり、その間に複数のユーザーが SW キャッシュ済の旧コードを実行し続けていた。

対策: クライアントから Worker 側に **`/v1/ping`** のような軽量 ping をバージョン付きで定期送信し、`x-app-version` のヒット率 / 旧バージョン残存率を Cloudflare Analytics で観測する（未実装）。

## 5. 残作業（フォローアップ）

| 優先度 | タスク | 担当層 |
|--------|--------|--------|
| 高 | `deploy-worker.yml` の後段に curl probe + 失敗時 Slack/メール通知 | CI |
| 高 | `cloudflare-workers-diag.yml` を cron で 1 日 1 回実行 | CI |
| 中 | `workers.dev` ではなく `proxy.advisers.jp` を Worker route として割当 | インフラ |
| 中 | アプリ側のエラーを `diag` ペイロードでまとめて Firestore `admin/errors` に書く（admin パネルで集約閲覧） | アプリ |
| 中 | Service Worker unregister-on-load を「念のため」運用ではなく、SW を一切持たないという明示的契約として README に明文化 | ドキュメント |
| 低 | クライアントから `/v1/ping?v=<cache_bust>` を送り旧バージョン残存率を観測 | 観測 |
| 低 | PR #38 で作成された `cares-ai-proxy` Worker が現存するなら明示的に削除 | クリーンアップ |

## 6. 設計原則の更新提案

CLAUDE.md の「絶対にやってはいけないこと」に以下を追加してはどうか:

- **Cloudflare Worker の public URL を直接クライアントから叩かない**。`cares-relay` のような service binding 経由の relay を 1 段挟む。Access / WAF / Rate Limiting / Bot Fight Mode が後で被さってきても影響を受けないようにする。
- **PWA / Service Worker を新規に登録しない**。過去の SW を unregister するコード（`index.html:1644-`）は維持。
- **CI deploy job は必ず本番 probe で締める**。`curl -fsS` を後段に置き、失敗したら job 自体を fail させる（deploy 成功 ≠ 動作確認済）。

## 7. 参考リンク

- PR #31 (全ユーザー Worker 強制) → #34 (撤回)
- PR #32 (SW unregister)
- PR #38 → #42 (Worker rename → revert)
- PR #43 (`cares-relay` 導入)
- PR #44, #45 (`deploy-worker.yml` 修正)
- PR #47 (workers.dev disable 検知 + 修復 workflow)
- `worker/relay.js`
- `.github/workflows/cloudflare-workers-diag.yml`
- `.github/workflows/deploy-worker.yml`
- `index.html:1617` (localStorage migration), `index.html:2186` (host_not_allowed 検知)
- `js/ai-engine.js:540-` (callAnthropic ルーティング)
