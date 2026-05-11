# アップデートノート: 2026-05-11 main 取り込み

## メタ情報

- **取り込み範囲**: `e8375fe..0060a29`（main から yanoshin_work へマージ）
- **PR**: #51 ← `0511_diff_check_to_main`
- **規模**: 29 ファイル / +4,009 行 / -631 行
- **コミット**: non-merge 46 件 / merge 22 件
- **期間**: 2026-04-28 〜 2026-05-11

---

## 全体サマリ（テーマ別）

1. [Firestore リアルタイム同期化（source of truth を Firestore に移行）](#1-firestore-リアルタイム同期化)
2. [ログアウト時データ漏洩バグ修正 + Store 型安全化](#2-ログアウト時データ漏洩バグ修正--store-型安全化)
3. [Web 全体の多言語対応（12言語 + DOM自動翻訳）](#3-web-全体の多言語対応12言語--dom自動翻訳)
4. [Google Fit 連携新規追加](#4-google-fit-連携新規追加)
5. [ユーザー記録の編集・削除 UI](#5-ユーザー記録の編集削除-ui)
6. [AI 接続障害シリーズ（5/10 の HOTFIX 連鎖）](#6-ai-接続障害シリーズ510-の-hotfix-連鎖)
7. [Worker インフラ整備（cares-relay 新設 + 診断ワークフロー）](#7-worker-インフラ整備cares-relay-新設--診断ワークフロー)
8. [Worker プロキシ仕様変更（拒否検知の全削除）](#8-worker-プロキシ仕様変更拒否検知の全削除)
9. [管理画面強化（Firestore ルール 1タップデプロイ）](#9-管理画面強化firestore-ルール-1タップデプロイ)
10. [Service Worker 自動 unregister（永続エラー対策）](#10-service-worker-自動-unregister)
11. [onclick ハンドラ堅牢化 + テスト強化](#11-onclick-ハンドラ堅牢化--テスト強化)
12. [マーケティング資産追加](#12-マーケティング資産追加)
13. [トップページ UI 調整 / 「AI」表記削除](#13-トップページ-ui-調整)

---

## 1. Firestore リアルタイム同期化

**コミット**: `e5cc53d` (2026-05-08), `77a8e20`/`3172aaf` (#21), `1356c7a` (2026-05-10)
**ファイル**: `js/firebase-backend.js` (+164), `js/store.js`

### 変更内容

- 旧: `loadAllData()` がログイン時に Firestore を **一回だけ** `.get()` で取得 → 別端末の変更が反映されず、再読み込みしないと最新が見えなかった。
- 新: `subscribeToCollections()` が 8 コレクションに `onSnapshot` リスナーを設置。書き込みが即座に全端末へ伝播する。
  - 対象: `textEntries`, `symptoms`, `vitals`, `sleep`, `activity`, `bloodTests`, `medications`, `conversations`
  - `_loading` フラグで autoSync との二重書き込みを防止
- `subscribeToSettings()` も新設。`selectedDiseases` / `selectedModel` / `customPrompts` / `userProfile` の設定変更も端末間で即同期。

### 仕様上の注意

- **`orderBy('createdAt', 'desc')` を撤廃**（`1356c7a`）。理由: Firestore は orderBy フィールドが欠けた document を silently 除外する仕様で、`createdAt` のない古いレコードが画面から消えていた。今後は `limit(500)` のみで取得し、クライアント側で `timestamp / createdAt / date / recordedAt` のいずれかでソートする。
- 管理画面 → Firebase タブに「データ診断」カードが追加された（クラウド件数 vs 画面件数、不一致時警告、強制再読込ボタン）。

---

## 2. ログアウト時データ漏洩バグ修正 + Store 型安全化

**コミット**: `76e1608` / `42ccd7e` / `7d364da` / `3f4c045` / `c9ade11` (2026-05-09)
**ファイル**: `js/store.js` (287行のリファクタ / 148+ 139-), `js/firebase-backend.js`

### Fix 1: DEFAULT_STATE による型安全な `clearAll()`

- 旧: `if (typeof === 'object') → {}` のため、`null` 値のキーが `{}` になるバグ。
- 新: `Store.DEFAULT_STATE` を一元定義し、`clearAll()` は DEFAULT_STATE の型をそのまま使う（`null` は `null` のまま）。

### Fix 2: `logout()` が `store.clearAll()` を確実に呼ぶ

- 旧: `store.update({ user: null, isAuthenticated: false })` のみ → 残り 35 キーが localStorage に居残り。
- 新: `store.clearAll()` を明示的に呼ぶ。`FirebaseBackend.signOut()` 内でも呼ぶが、Firebase 未初期化時のフォールバックとして二重保険。

### Fix 3: `localStorage.clear()` 撤廃 → `cc_*` プレフィックスのみ削除

- 他アプリ/拡張機能のデータを巻き込まなくなった。

### Fix 4: QuotaExceededError eviction

- `_evictOldData()` で低優先キーから順に削除。無限失敗ループを防止。

### 補足: `switchUser(uid)` は一度追加 → その後撤去された

- `42ccd7e` で `switchUser(uid)` を追加（ユーザー別 localStorage 名前空間）。
- 同一端末で別アカウント利用時のデータ混在防止が目的。
- しかし PR #25 (`40c7ec1` / `cca607c`) で **`switchUser` 自体は撤去**（データ消失バグの原因に）。`firebase-backend.js` 側の呼び出しも `2dc2bda` で削除。
- **現状: `switchUser` は存在しない**。

---

## 3. Web 全体の多言語対応（12言語 + DOM自動翻訳）

**コミット**: `769d041` (2026-05-05), `6ca18c0`
**ファイル**: `js/i18n.js` (+485 / +296)

### 仕組み

- `i18n.translatePage()` がページレンダリング後に DOM を走査し、日本語テキストノード・placeholder・ボタン・option を選択言語に **自動置換** する。
- `js/pages.js` (~4000行) のテンプレートを書き換えずに全ページを翻訳できる。
- `document.title` と `html lang` 属性も切り替え。

### 対応範囲

- サイドバーナビ（ホーム/記録/アクション/研究/相談/連携/設定）
- トップバー
- ログインページ（ボタン/フォームラベル/機能説明）
- ダッシュボード（入力欄/ボタン/見出し）
- 設定ページ（プロフィール/プライバシー/データ管理）

### 翻訳辞書

12 言語 × 70+ キーを `js/i18n.js` に追加:

| カバレッジ | 言語 |
|---|---|
| 完全（全 70 キー） | ja / en / zh / ko |
| 主要 UI（50+） | es / fr / de / pt |
| 基本 UI（30+） | th / vi / ar / hi |

不足キーは **日本語にフォールバック**。

### AI 応答も追従

`buildSystemPrompt()` + `callClaude()` で選択言語を system prompt に注入（`6ca18c0`）。UI と AI 両方が言語に追従する。

---

## 4. Google Fit 連携新規追加

**コミット**: `2dc2bda` (#28), `402e170` (#30)
**ファイル**: `js/integrations.js` (+185)

- ワンクリックで **心拍数・歩数・睡眠** を自動取込。
- `402e170` で診断ログ + エラーメッセージを追加（接続失敗時の切り分け用）。
- 既存スタック: Fitbit / Apple Health / Plaud に Google Fit が加わった形。
- 統合は `js/integrations.js` に集約（CLAUDE.md の「モジュールは単一ファイル」原則どおり）。

---

## 5. ユーザー記録の編集・削除 UI

**コミット**: `dba570d` (2026-05-09)
**ファイル**: `js/app.js`

新規 App メソッド:

- `deleteTextEntry(id)`: `textEntries` から該当 id を削除 + 紐づく `aiComments[id]` と (file_upload なら) `photos[photoId]` も併せて削除。
- `beginEditTextEntry(id)`: エントリーカードをインライン編集フォーム（タイトル input + content textarea + 保存/キャンセル）に差し替える。**フル再描画は避けてスクロール位置を維持**。
- `saveEditTextEntry(id)`: textarea の値で content/title を上書き、`editedAt` を記録、`store.set` で永続化。listener が `scheduleDashRefresh` で再描画。
- `cancelEditTextEntry(id)`: 再 set して通常表示に戻す。

---

## 6. AI 接続障害シリーズ（5/10 の HOTFIX 連鎖）

5/10 に AI 機能全滅 → 連続 HOTFIX が走った経緯。**最終的な仕様は最初に戻った** ので時系列の把握が重要。

### 6-1. PR #31: 全ユーザー Worker 強制（`1a93de8`）

- 「初めて来たユーザーには絶対にエラーを出さない」要件で、`getAnthropicEndpoint` の `hasKey` 引数を無視し常に Worker URL を返す実装に。
- `x-api-key` / `anthropic-dangerous-direct-browser-access` ヘッダも撤去。

### 6-2. HOTFIX: PR #31 撤回（`b869a36`）

- 「昨夜から急に動かない」ユーザー報告。PR #31 マージ時刻と一致。
- 原因: 既存登録ユーザーは admin の共有キーを `admin/secrets` から localStorage にミラーして直接 `api.anthropic.com` を叩いていたが、Worker 経由になり Worker 側の `env.ANTHROPIC_API_KEY` 未設定で全 401。
- **ルーティングを pre-#31 に戻した**: 客側キーあり → 直接、なし → Worker。

### 6-3. ゲスト復旧の追加対策（`1554565`）

- `resolveKey()` を「リセットボタンで API キーが消えない」「admin/config を 2 段階で取りに行く」仕様に。

### 6-4. Worker URL を localStorage 優先に戻す（`d6b550a`）

- ハードコード `agewaller` ドメイン優先を撤回。

### 6-5. エラー枠に「Worker URL を直接入力」フォーム追加（`4873c9c`）

- 自力復旧導線。

### 6-6. Worker rename → 撤回（`93952a7` → `86ef2ec`）

- Cloudflare Access 保護を回避するため `cares-ai-proxy` に rename → 撤回して `stock-screener` に戻した。

### 6-7. cares-relay Worker 新設（`d3f17b6`）→ [次セクション参照](#7)

### 6-8. Cloudflare Workers 全滅対応（`41a1cb2`）

- 症状: 全 `*.agewaller.workers.dev` が `HTTP 403 + x-deny-reason: host_not_allowed` を返す。
- 原因: Cloudflare アカウント設定で workers.dev サブドメインが無効化された典型挙動。Worker コードでは override 不可。
- 対応: `.github/workflows/cloudflare-workers-diag.yml` を追加（1 タップで全 Worker 到達性プローブ + クライアントエラー検知）。

### 6-9. AI 接続失敗時の診断機能（`3df6849`）

- 「接続できませんでした」を切り分けるためのクライアント側診断 UI 追加。候補: Worker deploy 失敗 / Worker URL 変更 / DNS / env.ANTHROPIC_API_KEY 未設定 / 企業 firewall。

---

## 7. Worker インフラ整備（cares-relay 新設 + 診断ワークフロー）

### 7-1. cares-relay Worker 新設

**コミット**: `d3f17b6` / PR #43
**新規ファイル**: `worker/relay.js`（31 行）, `wrangler.relay.jsonc`（17 行）

```js
// worker/relay.js（要点）
export default {
  async fetch(request, env) {
    if (!env.PROXY) return new Response(JSON.stringify({error:'service binding PROXY not configured'}), {status:500});
    return env.PROXY.fetch(request);  // service binding 経由で stock-screener Worker に丸投げ
  },
};
```

- **役割**: `cares-relay.agewaller.workers.dev` で受けたリクエストを **service binding 経由で** `stock-screener` Worker に転送。
- **なぜ**: `stock-screener.agewaller.workers.dev` は Cloudflare Access (Zero Trust) で保護されており、ブラウザの fetch が全て認証画面リダイレクト → CORS fail していた。
- **仕組み**: service binding は public URL を経由しない内部呼び出しなので、Access / WAF / Rate Limiting といった public 層の制限を全てバイパスする（Cloudflare 公式仕様）。
- **設定**: `wrangler.relay.jsonc` の `services: [{ binding: "PROXY", service: "stock-screener" }]`。`stock-screener` 側の `env.ANTHROPIC_API_KEY` をそのまま流用するので新規シークレット不要。

### 7-2. 新規 GitHub Actions ワークフロー（5本）

| ファイル | 行数 | 用途 |
|---|---|---|
| `.github/workflows/cloudflare-workers-diag.yml` | 165 | 全 Worker の到達性プローブ |
| `.github/workflows/cloudflare-access-cleanup.yml` | 143 | Access ポリシー一覧 / `delete_all_workers=yes` で一括削除 |
| `.github/workflows/fix-cloudflare-access.yml` | 193 | Access 緊急解除 |
| `.github/workflows/deploy-cares-ai-proxy.yml` | 125 | cares-ai-proxy デプロイ + 状態確認 |
| `.github/workflows/deploy-relay.yml` | 74 | cares-relay デプロイ |

### 7-3. deploy-worker.yml 修正

**コミット**: `12c2f7d` / `08d7353` (#44, #45) / `cbd59e4`
- `accountId` 不足で **9 連続失敗** していたのを直した（account ID をハードコード化）。
- `wrangler.jsonc` をワークフローのトリガーに追加 + config 明示。

---

## 8. Worker プロキシ仕様変更（拒否検知の全削除）

**コミット**: `c06b30b` / `0ab9938` (2026-05-04)
**ファイル**: `worker/anthropic-proxy.js` (159行差分), `wrangler.jsonc`, `index.html`

### 修正 1: wrangler.jsonc に `main` 追加（致命的バグ）

- 旧: `wrangler.jsonc` に `main` フィールドが無く、Worker が **静的サイトのみ** としてデプロイされていた。
- POST `/v1/messages` → HTML が返る → パース失敗 → 接続エラー。
- `wrangler.jsonc` (JSON) が `wrangler.toml` (TOML) より優先されることが原因。
- 修正: `"main": "worker/anthropic-proxy.js"` を追加 + 不要な `assets` セクション削除。

### 修正 2: 拒否検知の全削除

Worker 側:
- `isRefusal()` / `sanitizeRefusal()` / `wrapAsJournal()` / `gracefulFallback()` / `REFUSAL_PREVENTION` 定数 すべて削除
- メインハンドラの「refusal検知 → リトライ → fallback」全ブロック削除
- **Anthropic 応答をそのままパススルー** する仕様に
- `SAFE_SYSTEM_PROMPT` を拡充（役割定義 + 質問を控える指示）

クライアント側:
- `isRefusalReply()` / `REFUSAL_FALLBACK` 削除
- 5 箇所の `isRefusalReply(reply)` チェック削除
- `Cache-Control: no-cache` メタタグ追加

### 仕様上の影響

- AI 応答の **静的テンプレート差替が無くなった**。「毎回同じ回答」バグの根本原因だったため。
- ME/CFS ペーシング静的テンプレート（`gracefulFallback`）は復活しない予定。

---

## 9. 管理画面強化（Firestore ルール 1タップデプロイ）

**コミット**: `be12b0f` / `657cd99` (2026-05-10)
**ファイル**: `js/app.js`

### Firestore ルール自動デプロイ

- 管理画面 → 「🚀 Google で認証してデプロイ」ボタン。
- フロー:
  1. `firebase` スコープ付きで `reauthenticateWithPopup`
  2. `POST /firebaserules/v1/projects/{id}/rulesets` でアップロード
  3. `PATCH /releases/cloud.firestore` で公開
  4. 3 秒後にユーザー一覧再読込
- **サービスアカウント JSON も GitHub secret も不要、iPhone から完結する。**
- エラーハンドリング: popup-closed (キャンセル) / popup-blocked (設定促し)。

### Firestore ルール未デプロイ時の actionable エラー

- 旧: 不明なエラーで停止。
- 新: 状態を検知して具体的な復旧手順を画面に表示。

---

## 10. Service Worker 自動 unregister

**コミット**: `9794c14` (2026-05-09)
**ファイル**: `index.html`

### 背景

- ユーザー報告: 一度エラーが出たユーザーは何度試しても **永遠にエラー** が続く。
- 根本原因: 過去のビルド (`a9d314a` / `cf528a4` / `738fcd1`) で `/sw.js` を PWA Service Worker として登録 → 当時訪問したユーザーのブラウザに **古い SW がアクティブのまま残存**。SW は cache-first で古い HTML/JS を配信し続けるため、どれだけ修正をデプロイしても pre-fix コードしか届かない。

### 対策

- `index.html` の `<body>` 直後に防御的クリーンアップを実行:
  - `navigator.serviceWorker.getRegistrations()` で残存 SW を全 unregister
  - `caches.keys()` で SW が積み上げたキャッシュも削除
- リセットボタンも追加（ユーザー主導の復旧）。

---

## 11. onclick ハンドラ堅牢化 + テスト強化

**コミット**: `7e0aafb` (2026-05-09), `10da138`（前回 push 済 / `tests/smoke.test.js`）
**ファイル**: `js/app.js`, `tests/smoke.test.js` (+198)

### 根本原因

- `cca607c` (URGENT REVERT) が `ff21b6f` の追加していた `guestSampleSubmit` / `guestSampleReport` / `generateDoctorReport` の class methods を巻き込んで削除。
- index.html の DOMContentLoaded で `app.X = function(){}` 形式のランタイムパッチだけが残っていた。
- ランタイムパッチの問題:
  - DOMContentLoaded 前のタップで undefined
  - inline script パース失敗で一切定義されない
  - モジュール単体テストで検出できない

### 対策

- ランタイムパッチを **正式な App.prototype メソッドに昇格** + クラス内に書き戻し。
- smoke test を拡張（`onclick / onchange / oninput / onsubmit / onkeydown / onkeyup / onfocus / onblur / onload / onerror` の全 on* ハンドラを検査）。
- runtime patch を「defined」と見なさず、class method のみを durable contract とする。

---

## 12. マーケティング資産追加

**コミット**: `e2ac96b` (2026-04-28), `88f2e63` / `1fd4150` (2026-05-02)

### 12-1. Amazon アフィリエイトタグ切替（`e2ac96b`）

`chroniccare-22` → `forestvoice-22`（28 箇所のハードコード一括置換）:
- `js/config.js` (CONFIG.AFFILIATE_NETWORKS default)
- `js/disease-affiliate-panel.js`
- `js/app.js` (selfcare product cards × 23)
- `js/prompts.js` (URL example)
- `SYSTEM_ARCHITECTURE.md`
- `docs/収益化戦略.md`

### 12-2. マーケティング施策 CSV（`88f2e63`）

`docs/マーケティング施策_全リスト.csv`（125 行 × 12 列）:
- 列: ID / カテゴリ / 施策名 / 状態 / 担当 / 優先度 / 所要時間 / 想定コスト / 想定ユーザー獲得 / 期限 / 関連ファイル / 備考
- カテゴリ: SEO/LP, SEO/メタ, 開発/機能, コンテンツ, SNS (X/note/Reddit/Quora/Yahoo知恵袋/LINE/Threads/TikTok/YouTube/Instagram), アウトリーチ, プレスリリース, 計測, 収益化, 法務, メール, イベント, 広告, 海外展開, UX, データ, コミュニティ, DOC
- 使い方ガイド: `docs/マーケティング施策_Sheet使い方.md`（145 行）

### 12-3. エンタープライズ・医療関係者向けピッチ（`1fd4150`）

`docs/エンタープライズ・医療関係者向けピッチ.md` (368 行) + `enterprise-pitch.html`（A4 印刷用、139 行）:
- 10 セクション: executive summary / problem / product features / founder edge / enterprise use cases / medical use cases / tech stack / KPIs / roadmap / contact
- 引用エビデンス: IOM 2015, NICE 2021, 厚労省難治性疾患研究班, 日本消化管学会
- enterprise（健保組合・産業医・ESG/D&I・ROI）と medical（3分診療問題・90日サマリ・ICD-11・SaMD ではない明示）を明確に区別。

---

## 13. トップページ UI 調整

**コミット**: `ffe5577` (#27), `1b66767` (#22) (2026-05-09)

- 「今日の新処方の指定軸」をトップページから削除
- 「対象疾患を選択」を入力欄の上に移動
- 「お持ちの症状セクション」削除（疾患選択と機能重複）
- Google ログインを優先表示
- 年号修正
- **トップ画面から「AI」リテラルを全削除**（ユーザー向け文言に「AI」を混ぜない原則を徹底）

---

## ファイル変更一覧（参考）

| ファイル | 差分 | 主要テーマ |
|---|---:|---|
| `js/app.js` | +1043 | 編集/削除UI, Firestoreルール自動デプロイ, ヘルパー一斉昇格, アフィリエイト |
| `js/i18n.js` | +485 / -296 | 12 言語辞書 + DOM自動翻訳 |
| `index.html` | +442 / -208 | SW unregister, AI ルーティング, 診断UI, リセットボタン |
| `js/pages.js` | +267 / -123 | UI整理, トップページ調整, 「AI」表記削除 |
| `js/integrations.js` | +185 | Google Fit 連携 |
| `js/firebase-backend.js` | +164 | onSnapshot 同期, Firestore診断 |
| `tests/smoke.test.js` | +198 | on* ハンドラ全網羅, ランタイムパッチ除外 |
| `worker/anthropic-proxy.js` | +159 / -75 | 拒否検知全削除, パススルー化 |
| `js/ai-engine.js` | +28 | システムプロンプトに言語指示 |
| `js/disease-affiliate-panel.js` | ±4 | affiliate tag |
| `js/config.js` | ±2 | affiliate tag |
| `js/prompts.js` | ±2 | URL example |
| `og-image.svg` | ±4 | - |
| `robots.txt` | +1 | - |
| `wrangler.jsonc` | ±4 | `main` 追加 |
| `wrangler.relay.jsonc` | +17 | **新規**（cares-relay） |
| `worker/relay.js` | +31 | **新規**（cares-relay 本体） |
| `.github/workflows/deploy-worker.yml` | +120 / -? | accountId 修正 |
| `.github/workflows/cloudflare-workers-diag.yml` | +165 | **新規** |
| `.github/workflows/cloudflare-access-cleanup.yml` | +143 | **新規** |
| `.github/workflows/fix-cloudflare-access.yml` | +193 | **新規** |
| `.github/workflows/deploy-cares-ai-proxy.yml` | +125 | **新規** |
| `.github/workflows/deploy-relay.yml` | +74 | **新規** |
| `enterprise-pitch.html` | +139 | **新規** |
| `docs/エンタープライズ・医療関係者向けピッチ.md` | +368 | **新規** |
| `docs/マーケティング施策_Sheet使い方.md` | +145 | **新規** |
| `docs/マーケティング施策_全リスト.csv` | +126 | **新規** |
| `docs/収益化戦略.md` | ±2 | affiliate tag |
| `SYSTEM_ARCHITECTURE.md` | ±4 | affiliate tag, ネットワーク数 |

---

## 既知の論点 / 要追跡

1. **`switchUser(uid)` の出戻り**: 一度導入されて即撤去された。ユーザー別 localStorage 名前空間は **現在実装されていない**。同一端末で別アカウントを使った場合のデータ混在は再度検討余地あり。
2. **AI ルーティング**: 「客側キーあり → 直接 Anthropic / なし → Worker」に戻った。in-app ブラウザの CORS 制約に当たるケースは別途対処（`d12d669` などで in-app 検出を拡張済）。
3. **Cloudflare Access**: 5/10 のインシデント以降、stock-screener Worker は Access 保護を継続。public 経路は `cares-relay` の service binding 経由で迂回する設計が前提になった。
4. **拒否検知の復活なし**: `gracefulFallback` / `isRefusalReply` 等は **意図的に削除済み**。再追加の提案があれば「毎回同じ回答バグ」の経緯を確認すること。
5. **Service Worker 永続復旧**: `/sw.js` は今後 PWA 化しない方針（cache-first 戦略のリスクが顕在化したため）。再導入する場合は network-first + 短い TTL を強制する設計が必要。
