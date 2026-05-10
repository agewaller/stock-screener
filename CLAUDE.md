# 健康日記（Health Diary, 旧名: 未病ダイアリー）

慢性疾患患者のための体調記録・情報整理ツール（SPA, vanilla JS）。
サイト: https://cares.advisers.jp / リポジトリ: `agewaller/stock-screener`

このリポジトリには兄弟プロダクトも同居している:
- **健康日記** (`index.html` + `js/*.js`) — メインSPA
- **疾患ランディングページ** (10 疾患の静的 HTML) — `me-cfs.html` / `long-covid.html` / `fibromyalgia.html` / `pots.html` / `mcas.html` / `eds.html` / `ibs.html` / `hashimoto.html` / `depression.html` / `insomnia.html`
- **Personal Learning Companion** (`learning.html` + `worker/learning-orchestrator.js`) — Firestore namespace `learning_users/` で完全分離

## アーキテクチャ

**モジュール分割 SPA**: `index.html` (HTML + CSS) + `js/*.js`。
ビルド工程は存在しない。`<script src="js/...?v=NN">` で依存順に読み込む（`v=` はキャッシュバスター、index.html を編集する際は数字を bump する）。

```
index.html                      ← HTML シェル + CSS（メイン SPA、JS なし）
*.html (10 疾患 + about / compare / pitch / faq/ ...) ← 静的 LP

js/idb.js                       ← IndexedDB ラッパー + Firestore 書き込みキュー
js/config.js                    ← CONFIG（疾患定義、AI モデル、定数）
js/prompts.js                   ← 全プロンプトテンプレート（PROMPT_HEADER, DEFAULT_PROMPTS, INLINE_PROMPTS）
js/store.js                     ← Store + localStorage 永続化
js/privacy.js                   ← Privacy（PII 匿名化）
js/ai-engine.js                 ← AIEngine（Anthropic / OpenAI / Gemini）+ PubMed + MODEL_MAP
js/affiliate.js                 ← AffiliateEngine（商品レコメンド）
js/components.js                ← Components（UI ヘルパー、escapeHtml 等）
js/i18n.js                      ← I18n（多言語）+ DOMContentLoaded init
js/calendar.js                  ← CalendarIntegration（Google Calendar / ICS）
js/integrations.js              ← Integrations（Plaud / Fitbit / Apple Health / autoSync）
js/firebase-backend.js          ← FirebaseBackend（Auth + Firestore + per-user hash）
js/app.js                       ← App クラス + `var app` インスタンス
js/pages.js                     ← App.prototype.render_* 全画面レンダラー

# 疾患 LP / static HTML 専用（メイン SPA からは読まない）
js/analytics.js                 ← Cloudflare Web Analytics（DNT 尊重）
js/a11y-enhancements.js         ← skip link, theme-color, prefers-reduced-motion
js/disease-lp-enhancements.js   ← sticky CTA、Breadcrumb JSON-LD
js/disease-affiliate-panel.js   ← 疾患別アフィリエイト枠（ステマ規制対応）
js/inapp-browser-banner.js      ← FB / LINE / X 等 in-app ブラウザの誘導バナー
js/newsletter-signup.js         ← Firestore newsletter_subscribers/{hash}
js/social-share.js              ← X / FB / LINE / はてブ / Pinterest シェア導線

worker/anthropic-proxy.js       ← stock-screener Worker（Claude API プロキシ + KV research）
worker/relay.js                 ← cares-relay Worker（Access 回避、service binding で stock-screener へ）
worker/plaud-inbox.js           ← Plaud メール受信 Worker（Cloudflare Email Workers）
worker/professional-mailer.js   ← 専門家メール送信 Worker
worker/research-updater.js      ← 週次 cron で PubMed → KV に研究情報をキャッシュ
worker/learning-orchestrator.js ← Personal Learning Companion バックエンド

firestore.rules                 ← Firestore セキュリティルール（健康日記 + learning + inbox）
firebase.json                   ← Firebase CLI 設定（rules ファイルへのポインタのみ）
.githooks/pre-commit            ← 禁則パターン検出
tests/smoke.test.js             ← 静的解析スモークテスト（20 セクション）
scripts/seed-prompts.mjs        ← Personal Learning Companion 用 prompt seed スクリプト
CNAME                           ← cares.advisers.jp DNS 設定
```

**編集の鉄則**: 該当する `js/*.js` モジュールを編集する。`index.html` の `<script>` タグの `?v=NN` を bump して PWA / ブラウザのキャッシュを破棄する。ビルド工程は存在しない。

## デプロイ

```bash
# JS / HTML / CSS の変更
git add js/config.js index.html
git commit -m "変更内容"
git push origin main             # → pages.yml が GitHub Pages へ自動デプロイ

# Worker の変更（worker/* または wrangler.* を変更すると発火）
git add worker/anthropic-proxy.js
git commit -m "..."
git push origin main             # → deploy-worker.yml が wrangler deploy

# Firestore rules の変更
git add firestore.rules
git push origin main             # → deploy-firestore-rules.yml
```

各 Worker は独立した wrangler 設定を持つ:
| Worker | 設定ファイル | 役割 |
|--------|------------|------|
| stock-screener | `wrangler.jsonc` | Anthropic API プロキシ（Cloudflare Access 保護下） |
| cares-relay | `wrangler.relay.jsonc` | Access 迂回。service binding で stock-screener へ転送 |
| plaud-inbox | `wrangler.plaud-inbox.toml` | Email Worker（受信） |
| professional-mailer | `wrangler.professional-mailer.toml` | メール送信 |
| research-updater | `wrangler.research-updater.toml` | 週次 cron で PubMed → KV |
| learning-orchestrator | `wrangler.learning.toml` | Personal Learning Companion |

`wrangler.toml` はレガシーで `wrangler.jsonc` と重複している（同じ stock-screener Worker を指す）。

## メイン SPA の JS 読み込み順（依存順）

`index.html` 末尾の `<script>` タグ順:

1. `js/idb.js` — `var IDB`（IndexedDB + 書き込みキュー）
2. `js/config.js` — `var CONFIG`（疾患、AI モデル、Firebase config 含む）
3. `js/prompts.js` — `var PROMPT_HEADER`, `DEFAULT_PROMPTS`, `INLINE_PROMPTS`
4. `js/store.js` — `var store = new Store()`
5. `js/privacy.js` — `var Privacy`
6. `js/ai-engine.js` — `var aiEngine = new AIEngine()`（MODEL_MAP / PubMed / Vision 含む）
7. `js/affiliate.js` — `var affiliateEngine`
8. `js/components.js` — `var Components`
9. `js/i18n.js` — `var I18n` + DOMContentLoaded で言語初期化
10. `js/calendar.js` — `var CalendarIntegration`
11. `js/integrations.js` — `var Integrations`（Plaud / Fitbit / Apple Health / autoSync）
12. `js/firebase-backend.js` — `var firebaseBackend = new FirebaseBackend()`
13. `js/app.js` — `var App = class { ... }; var app = new App()`
14. `js/pages.js` — `App.prototype.render_*`（dashboard / data_input / analysis / actions / research / chat / timeline / integrations / admin / settings / privacy / login / disease_select 等）

`js/inapp-browser-banner.js` は別途 defer で読み込み。

## AI モデル

- **設定上のデフォルト**: `CONFIG.AI_MODELS` で Sonnet 4.6 が `default: true`
- **ランタイムフォールバック**: `selectedModel` が未設定なら Opus 4.6
- 選択肢: Opus 4.6 / Sonnet 4.6 / Haiku 4.5 / GPT-4o / Gemini 2.5 Pro
- **Anthropic 経路**: ブラウザ → `cares-relay.agewaller.workers.dev` → service binding → `stock-screener` Worker → Anthropic API。`localStorage.anthropic_proxy_url` で上書き可、未設定時は `cares-relay` 固定。
- **なぜ 2 段 Worker か**: `stock-screener` 単体は Cloudflare Access (Zero Trust) で保護されているためブラウザ fetch が認証画面へリダイレクトされて CORS で fail する。`cares-relay` は service binding 経由で内部呼び出しするので Access / WAF / Rate Limit を全てバイパスする。
- `ai-engine.js` の `MODEL_MAP` で CONFIG id → API id を動的解決（**ハードコード禁止**、Anthropic は model id を定期的に rotate する）
- Vision / PDF: `options.imageBase64` または `options.pdfBase64` で content array に切り替わる（PDF は image block ではなく document block — image だと silently fail する）
- OpenAI と Gemini は CORS 不要のためブラウザから直接呼び出し

## 絶対にやってはいけないこと

- ダークテーマの CSS を追加しない（`:root` はライトテーマ固定）
- `localStorage.clear()` を使わない（`store.clearAll()` を使う。Firebase 設定が消える）
- `confirm()` / `alert()` を使わない（モバイルでブロックされる。インライン UI にする）
- `signInWithPopup` をモバイルで使わない（`signInWithRedirect` を使う）
- API キー・Firebase 設定をコードにハードコードしない（管理パネル経由で設定。CONFIG.FIREBASE は公開可能な web API key のみ）
- 管理者メール `agewaller@gmail.com` を削除しない
- Google 翻訳リンクは必ず `translate.goog` サブドメイン形式（`<host-with-dashes>.translate.goog/...?_x_tr_sl=...&_x_tr_tl=ja&_x_tr_hl=ja`）を使う。旧 `translate.google.com/translate?u=` 形式は 2019 年に廃止されていてクリックすると無限リダイレクトする
- Claude モデル id（`claude-3-5-sonnet-20241022` 等の datestamped 名）をハードコードしない。必ず `MODEL_MAP` 経由で解決する。MODEL_MAP は **undated alias**（`claude-opus-4-6` 等）を使うこと
- ユーザー画面のテキストに「AI」リテラルを入れない（`render_*` 内で逆引きチェック）

## コーディング規約

- フレームワークなし（vanilla JS のみ）
- テンプレートリテラルで HTML を返す（JSX なし）
- AI の応答内容はすべて `CONFIG` / `prompts.js` 内のプロンプトで制御。JS にハードコードしない
- ユーザー向けテキストは日本語。専門用語を避ける（ペルソナ: 65歳女性）
- ユーザー入力を DOM に挿入する前に `Components.escapeHtml()` で escape する
- URL の正規表現は ASCII のみ（日本語文字を巻き込まない）
- 関数名: camelCase。CSS クラス: kebab-case
- ページレンダラーは `App.prototype.render_*` の規約。`pages.js` に集約する

## 管理者

- メール: `agewaller@gmail.com`（Firebase Auth の token.email で照合）
- カスタムクレーム `role=admin` も同等に扱う（firestore.rules `isAdmin()` 参照）
- 管理パネル（`/admin`）: プロンプト管理、API キー、Firebase 設定、Firestore rules 自動デプロイ、ユーザ管理
- `saveApiKeys` / `clearApiKeys` は `isAdmin()` ガードが必須

## 開発環境セットアップ

初回 clone 直後に一度だけ実行（ローカル設定のため clone ごとに必要）:

```bash
git config core.hooksPath .githooks
```

これで `.githooks/pre-commit` が有効化され、以下の禁則パターンを commit 時に自動検出する:

- datestamped Claude / OpenAI model id のハードコード（`ai-engine.js` の MODEL_MAP は例外）
- `localStorage.clear()`
- `confirm()` / `alert()`
- `signInWithPopup`
- 旧 Google 翻訳 URL 形式
- ハードコードされた Google / Firebase API key（`AIza...`）

緊急 bypass（基本使わない）: `ALLOW_DANGEROUS=1 git commit ...`

## テスト

```bash
node tests/smoke.test.js
```

`index.html` + `js/*.js` を静的解析するスモークテスト（20 セクション、要 Node 18+、追加依存なし）:
構文 / on\* ハンドラの配線 / 全 render\_\* の存在 / 認証フロー / AI エンジン / プロンプト整合性 / 翻訳リンク / 写真アップロード / カレンダー連携 / Plaud / 栄養ダッシュボード / データ完全性 / Worker CORS / Firestore rules / モバイル安全性 / 多言語 / デプロイ設定 / セキュリティ。

## Firestore データモデル（要点）

- `users/{uid}` — 健康日記の per-user データ。subcollections: `textEntries`, `symptoms`, `vitals` 等。**所有者のみ書き込み**、admin は読み取り可
- `admin/{docId}` — `admin/config`, `admin/secrets` 等。全認証ユーザー読み取り可、admin のみ書き込み
- `inbox/{hash}/{kind}/{messageId}` — Plaud / Email Worker 経由の受信箱。`hash` は uid/email を `Integrations.simpleHash` で 8 文字 base36 化。Worker は REST API key で create、ユーザは hash 一致時のみ read / update
- `learning_users/{uid}` — Personal Learning Companion 用、健康日記とは完全分離。`sessions` のみクライアント create 可、`messages` は Worker (Admin SDK) のみ書き込み
- `prompts/*`, `aiModes/*`, `auditLogs/*`, `safetyEvents/*` — **全クライアント読み書き禁止**。Worker (Admin SDK) のみアクセス
- `newsletter_subscribers/{hash}` — 静的 LP からの匿名 create（Auth 不要）

## 外部サービス統合プラン（車輪の再発明をしない）

**原則**: 既存のサービス・ライブラリで解決できるものはゼロから作らない。
新機能の前に既存スタックで解決できないか必ず検討する。

### 判断のチェックリスト（新機能追加前に順に検討）

1. 既存の健康日記機能で代替できないか？
2. 既存の外部サービス（Firebase, Anthropic, Google 等）の機能を拡張すれば済まないか？
3. Firebase Extensions で追加できないか？（Trigger Email, Search with Algolia 等）
4. Cloudflare Worker で実装できないか？（既存のプロキシ基盤 `worker/` を使える）
5. それでも必要なら、下記の統合ルールに従って新サービスを追加する

### 現状の外部サービス（実装済）

| 機能 | 採用サービス | 統合ファイル |
|------|-------------|-------------|
| 認証 | Firebase Authentication | `js/firebase-backend.js` |
| DB | Firebase Firestore | `js/firebase-backend.js` |
| 大容量データ | IndexedDB（画像 / 解析履歴） | `js/idb.js` |
| AI | Anthropic / OpenAI / Gemini | `js/ai-engine.js` + `worker/anthropic-proxy.js` + `worker/relay.js` |
| 文献検索 | PubMed (NCBI E-utilities) | `js/ai-engine.js` + `worker/research-updater.js` |
| カレンダー | Google Calendar / ICS | `js/calendar.js` |
| ウェアラブル | Fitbit / Apple Health | `js/integrations.js` |
| メール受信 | Cloudflare Email Workers | `worker/plaud-inbox.js` |
| メール送信 | Cloudflare Worker | `worker/professional-mailer.js` |
| ニュースレター | Firestore（後で Mailchimp 等同期予定） | `js/newsletter-signup.js` |
| アクセス解析 | Cloudflare Web Analytics（DNT 尊重） | `js/analytics.js` |

### 新サービス追加時の共通ルール

1. **管理画面で API キーを設定**（コードにハードコードしない）
2. **`admin/config` または `admin/secrets` に保存**（全ユーザー共有。per-user トークンのみ localStorage）
3. **`CONFIG.{service}` に展開**（`js/config.js` で型とデフォルト値を定義）
4. **モジュールは単一ファイル**（`js/{service}-integration.js` に集約）
5. **フォールバック必須**（サービス未設定でも健康日記全体が動く）
6. **ユーザー画面ではサービス名を出さない**（「通知を送る」「連携する」等の一般名詞で）
7. **README か CLAUDE.md に設定手順を追加**（非エンジニアが設定できるレベルで）

### 「追加しない」判断も明文化する

以下は検討したが**採用しない**。再提案されても最初に理由を確認する:

- **Supabase Auth / Clerk**: Firebase Auth で十分（Google OAuth + Email/Password + カスタムクレーム）
- **Supabase (PostgreSQL)**: Firestore で足りている。SQL による複雑分析が必要になるまで見送り
- **shadcn/ui**: React 依存のため vanilla JS プロジェクトには直接使えない。原則（アクセシビリティ・CSS 変数・コピペ可能）のみ採用
- **Algolia**: 10 万件未満なら Firestore クライアントフィルタで十分。それを超えたら検討
- **AdSense**: 健康コンテンツは YMYL カテゴリで承認・収益化リスクが高い。アフィリエイト + ステマ規制準拠表示で代替（`disease-affiliate-panel.js`）
