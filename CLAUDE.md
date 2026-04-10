# 未病ダイアリー（Mibyou Diary）

慢性疾患患者のための体調記録・情報整理ツール（SPA, vanilla JS）。
サイト: https://cares.advisers.jp

## アーキテクチャ

**単一ファイル SPA**: `index.html` 1 枚が HTML / `<style>` / `<script>` を全て内包する。
外部 JS / CSS ファイルは存在しない（CDN の Chart.js, Firebase を除く）。

```
index.html                    ← 本番SPA（この 1 ファイルが全て）
CNAME                         ← cares.advisers.jp DNS 設定
firestore.rules               ← Firestore セキュリティルール
worker/anthropic-proxy.js     ← Cloudflare Worker（Claude API CORS プロキシ）
wrangler.{jsonc,toml}         ← Worker デプロイ設定
.github/workflows/pages.yml   ← GitHub Pages 自動デプロイ
.github/workflows/deploy-worker.yml ← Cloudflare Worker 自動デプロイ
```

**編集の鉄則**: `index.html` だけを触る。ビルド工程は存在しない。

## デプロイ

```bash
git add index.html
git commit -m "変更内容"
git push origin main             # → GitHub Pages 自動デプロイ（pages.yml）
# 開発ブランチ work でも pages.yml を実行する設定に変更済み
```

Worker を変更した場合は `worker/anthropic-proxy.js` を編集→push で
`deploy-worker.yml` が Cloudflare に自動配布する。

## index.html 内部構造（スクロール順）

1. `<head>`: meta, Chart.js + Firebase CDN script tags
2. `<style>`: 全 CSS（ライトテーマ固定、`:root` のみ）
3. `<body>`: ルート DOM
4. `<script>` ブロック群（依存順）:
   - `CONFIG` — 疾患定義、全プロンプト、AI_MODELS
   - `Store` — 状態管理 + localStorage 永続化
   - `AIEngine` — OpenAI / Anthropic / Google + PubMed 呼び出し
   - `AffiliateEngine` — 商品レコメンド
   - `Components` — UI コンポーネント生成関数
   - `I18n` — 多言語
   - `CalendarIntegration`
   - `Integrations` — Plaud / Apple Health / Fitbit
   - `FirebaseBackend` — Auth + Firestore 同期
   - `App` — メインロジック（ナビ、フォーム、API、レンダリング）
   - `App.prototype.render_*` — 全画面レンダラー

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
