# 健康日記（Health Diary, 旧名: 未病ダイアリー）

慢性疾患患者のための体調記録・情報整理ツール（SPA, vanilla JS）。
サイト: https://cares.advisers.jp

## アーキテクチャ

**モジュール分割 SPA**: `index.html` (HTML + CSS) + `js/*.js` (13 モジュール)。
ビルド工程は存在しない。`<script src="js/...">` で依存順に読み込む。

```
index.html                    ← HTML シェル + CSS（JS なし）
js/config.js                  ← CONFIG（疾患定義、設定、定数）
js/prompts.js                 ← 全プロンプトテンプレート
js/store.js                   ← 状態管理 + localStorage 永続化
js/privacy.js                 ← PII マスキング
js/ai-engine.js               ← AI モデル呼び出し + PubMed
js/affiliate.js               ← 商品レコメンド
js/components.js              ← UI コンポーネント生成関数
js/i18n.js                    ← 多言語
js/calendar.js                ← Google Calendar / ICS 連携
js/integrations.js            ← Plaud / Fitbit / Apple Health / CSV
js/firebase-backend.js        ← Firebase Auth + Firestore 同期
js/app.js                     ← メインロジック（ナビ、フォーム、API）
js/pages.js                   ← 全画面レンダラー (render_*)
worker/anthropic-proxy.js     ← Cloudflare Worker（Claude API プロキシ）
worker/plaud-inbox.js         ← Plaud メール受信 Worker
worker/professional-mailer.js ← 専門家メール送信 Worker
firestore.rules               ← Firestore セキュリティルール
CNAME                         ← cares.advisers.jp DNS 設定
```

**編集の鉄則**: 該当する `js/*.js` モジュールを編集する。ビルド工程は存在しない。

## デプロイ

```bash
git add js/config.js  # 変更したファイルを add
git commit -m "変更内容"
git push origin main             # → GitHub Pages 自動デプロイ（pages.yml）
```

Worker を変更した場合は `worker/*.js` を編集→push で
`deploy-worker.yml` が Cloudflare に自動配布する。

## JS モジュール構成（読み込み順 = 依存順）

1. `js/config.js` — CONFIG オブジェクト（疾患、AI モデル、金銭サポート等）
2. `js/prompts.js` — PROMPT_HEADER, DEFAULT_PROMPTS, INLINE_PROMPTS
3. `js/store.js` — Store クラス + `var store` インスタンス
4. `js/privacy.js` — Privacy（PII 匿名化）
5. `js/ai-engine.js` — AIEngine + PubMed + `var aiEngine`
6. `js/affiliate.js` — AffiliateEngine + `var affiliateEngine`
7. `js/components.js` — Components（UI ヘルパー）
8. `js/i18n.js` — 多言語 + DOMContentLoaded init
9. `js/calendar.js` — CalendarIntegration
10. `js/integrations.js` — Integrations（Plaud / Fitbit / Apple Health / autoSync）
11. `js/firebase-backend.js` — FirebaseBackend（Auth + Firestore）
12. `js/app.js` — App クラス + `var app` インスタンス
13. `js/pages.js` — App.prototype.render_* 全画面レンダラー

## AI モデル

- **デフォルト**: `claude-opus-4-6`（最強、課金OK）
- 選択肢: Opus 4.6 / Sonnet 4.6 / Haiku 4.5 / GPT-4o / Gemini 2.5 Pro
- Anthropic は Cloudflare Worker 経由（`anthropic_proxy_url` を localStorage に保存、未設定なら `https://stock-screener.agewaller.workers.dev`）
- `callAnthropic` は MODEL_MAP で CONFIG id → API id を動的マッピング（ハードコード禁止、Anthropic は model id を定期的に rotate する）
- Vision: `options.imageBase64` で自動的に image block 付きに切り替わる

## 絶対にやってはいけないこと

- ダークテーマの CSS を追加しない（`:root` はライトテーマ固定）
- `localStorage.clear()` を使わない（`store.clearAll()` を使う。Firebase 設定が消える）
- `confirm()` / `alert()` を使わない（モバイルでブロックされる。インライン UI にする）
- `signInWithPopup` をモバイルで使わない（`signInWithRedirect` を使う）
- API キー・Firebase 設定をコードにハードコードしない（管理パネル経由で設定）
- 管理者メール `agewaller@gmail.com` を削除しない
- Google 翻訳リンクは必ず `translate.goog` サブドメイン形式（`<host-with-dashes>.translate.goog/...?_x_tr_sl=...&_x_tr_tl=ja&_x_tr_hl=ja`）を使う。旧 `translate.google.com/translate?u=` 形式は 2019 年に廃止されていてクリックすると無限リダイレクトする
- Claude モデル id（`claude-3-5-sonnet-20241022` 等の datestamped 名）をハードコードしない。必ず `MODEL_MAP` 経由で解決する

## コーディング規約

- フレームワークなし（vanilla JS のみ）
- テンプレートリテラルで HTML を返す（JSX なし）
- AI の応答内容はすべて `CONFIG` 内のプロンプトで制御。JS にハードコードしない
- ユーザー向けテキストは日本語。専門用語を避ける（ペルソナ: 65歳女性）
- ユーザー向けの文言に「AI」リテラルを混ぜない（`render_*` でのチェック）
- ユーザー入力を DOM に挿入する前に `Components.escapeHtml()` で escape する
- URL の正規表現は ASCII のみ（日本語文字を巻き込まない）
- 関数名: camelCase。CSS クラス: kebab-case

## 管理者

- メール: `agewaller@gmail.com`
- 管理パネル（`/admin`）: プロンプト管理、API キー、Firebase 設定、データ管理
- `saveApiKeys` / `clearApiKeys` は `isAdmin()` ガードが必須
