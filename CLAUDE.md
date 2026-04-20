# 健康日記（Health Diary）

慢性疾患患者のための体調記録・情報整理ツール（SPA, vanilla JS）。
サイト: https://cares.advisers.jp

## アーキテクチャ

**単一ファイル SPA**: `index.html` 1 枚（18,108行, ~960KB）が HTML / CSS / JS を全て内包する。
外部 JS / CSS ファイルは存在しない（CDN の Chart.js, Firebase v10.12, Google Fonts を除く）。

```
index.html                    ← 本番SPA（この 1 ファイルが全て）
CNAME                         ← cares.advisers.jp DNS 設定
firestore.rules               ← Firestore セキュリティルール
firebase.json                 ← Firebase 設定
worker/anthropic-proxy.js     ← Cloudflare Worker（Claude API CORS プロキシ）
worker/plaud-inbox.js         ← Cloudflare Email Worker（Plaud 文字起こし受信）
wrangler.jsonc                ← Worker 設定（メイン）
wrangler.toml                 ← Worker 設定（anthropic-proxy）
wrangler.plaud-inbox.toml     ← Worker 設定（plaud-inbox）
.github/workflows/pages.yml           ← GitHub Pages 自動デプロイ
.github/workflows/deploy-worker.yml   ← Cloudflare Worker 自動デプロイ
.github/workflows/deploy-firestore-rules.yml ← Firestore ルール自動デプロイ
tests/smoke.test.js           ← スモークテスト（node tests/smoke.test.js）
```

**疾患別ランディングページ（7枚）**:
```
long-covid.html    ← Long COVID（コロナ後遺症）
fibromyalgia.html  ← 線維筋痛症
depression.html    ← うつ病（大うつ病性障害）
pots.html          ← POTS（体位性頻脈症候群）
mcas.html          ← MCAS（マスト細胞活性化症候群）
eds.html           ← EDS（エーラス・ダンロス症候群）
insomnia.html      ← 不眠症
```

**編集の鉄則**: `index.html` だけを触る。ビルド工程は存在しない。

## デプロイ

```bash
git add index.html
git commit -m "変更内容"
git push origin main             # → GitHub Pages 自動デプロイ（pages.yml）
```

Worker を変更した場合は `worker/` 以下を編集→push で `deploy-worker.yml` が Cloudflare に自動配布する。

## index.html 内部構造（行番号ガイド）

| セクション | 行範囲 | 行数 | 内容 |
|-----------|--------|------|------|
| HEAD & メタ | 1-414 | 414 | meta, SEO, OG, JSON-LD, CDN |
| CSS | 415-1604 | 1,190 | 全スタイル（ライトテーマ固定） |
| HTML Body | 1608-2023 | 416 | サイドバー、ナビ、ランディング |
| **CONFIG** | **2029-3608** | **1,580** | 疾患定義、定数、Firebase設定 |
| UNIVERSAL_PROMPTS | 3439-3610 | 172 | 汎用AIプロンプト（5件） |
| DISEASE_PROMPTS | 3611-3899 | 289 | 疾患別プロンプト（60+件） |
| INLINE_PROMPTS | 3908-4724 | 817 | リアルタイム分析プロンプト（20+件） |
| Store | 4732-5063 | 332 | 状態管理 + localStorage |
| Privacy | 5085-5125 | 41 | PII匿名化ユーティリティ |
| AIEngine | 5133-6235 | 1,103 | AI呼び出し + MODEL_MAP |
| AffiliateEngine | 6245-6440 | 196 | 商品レコメンド |
| Components | 6452-6937 | 486 | UI コンポーネント |
| I18n | 6944-7125 | 182 | 多言語（日本語メイン） |
| CalendarIntegration | 7136-7570 | 435 | Google Calendar連携 |
| Integrations | 7578-8531 | 954 | Plaud / Apple Health / Fitbit / PubMed |
| FirebaseBackend | 8539-9435 | 897 | Auth + Firestore同期 |
| **App** | **9442-14561** | **5,120** | メインロジック |
| Page Renderers | 14572-17349 | 2,778 | 全13画面レンダラー |
| Event Init | 17543-18101 | 559 | DOMContentLoaded + リスナー |

## 画面レンダラー一覧（13画面）

| 関数名 | 行範囲 | 画面 |
|--------|--------|------|
| render_login | 14572-14951 | ログイン / 疾患選択 |
| render_disease_select | 14954-15021 | 疾患チェックボックス |
| render_dashboard | 15040-15601 | ホーム（ダッシュボード） |
| render_data_input | 15604-15883 | 記録入力フォーム |
| render_analysis | 15886-15929 | AI分析結果表示 |
| render_actions | 15967-16170 | アクション（クリニック等） |
| render_research | 16173-16211 | PubMed研究ブラウザ |
| render_chat | 16214-16241 | AIチャット |
| render_timeline | 16244-16471 | タイムライン |
| render_integrations | 16475-16846 | 外部連携 |
| render_admin | 16849-17190 | 管理パネル |
| render_settings | 17193-17307 | 設定 |
| render_privacy | 17361-17540 | プライバシーポリシー |

## AI モデル

- **デフォルト**: `claude-opus-4-6`（最強、課金OK）
- 選択肢: Opus 4.6 / Sonnet 4.6 / Haiku 4.5 / GPT-4o / Gemini 2.5 Pro
- Anthropic は Cloudflare Worker 経由（`anthropic_proxy_url` を localStorage に保存、未設定なら `https://stock-screener.agewaller.workers.dev`）
- `callAnthropic` は MODEL_MAP で CONFIG id → API id を動的マッピング（ハードコード禁止、Anthropic は model id を定期的に rotate する）
- Vision: `options.imageBase64` で自動的に image block 付きに切り替わる

## 疾患カテゴリ（8グループ, 80+疾患）

- **Neuro**: ME/CFS, 線維筋痛症, 片頭痛, てんかん, MS, パーキンソン, ALS, 神経障害, 自律神経障害, POTS, TBI, 慢性疼痛
- **Mental**: うつ病, 双極性障害, GAD, PTSD, cPTSD, OCD, ADHD, ASD, 摂食障害, 不眠症, バーンアウト, 解離
- **Immune**: Long COVID, MCAS, SLE, RA, シェーグレン, 橋本病, クローン, UC, セリアック, 乾癬, 免疫不全, アレルギー
- **Endocrine**: 糖尿病T1/T2, 甲状腺機能低下/亢進, 副腎, PCOS, メタボ, 肥満, 痛風, 骨粗鬆症
- **Cardiovascular / Respiratory / Digestive / その他**

## 絶対にやってはいけないこと

- ダークテーマの CSS を追加しない（`:root` はライトテーマ固定）
- `localStorage.clear()` を使わない（`store.clearAll()` を使う。Firebase 設定が消える）
- `confirm()` / `alert()` を使わない（モバイルでブロックされる。インライン UI にする）
- `signInWithPopup` をモバイルで使わない（`signInWithRedirect` を使う）
- API キー・Firebase 設定をコードにハードコードしない（管理パネル経由で設定）
- 管理者メール `agewaller@gmail.com` を削除しない
- Google 翻訳リンクは必ず `translate.goog` サブドメイン形式を使う（旧 `translate.google.com/translate?u=` 形式は 2019 年に廃止済み）
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
- プロンプト変数は `{{TEMPLATE_VARS}}` 形式で `AIEngine.interpolatePrompt()` が展開

## セキュリティ

- XSS: `Components.escapeHtml()` で全ユーザー入力をエスケープ
- PII: `Privacy.anonymizeText()` でAI送信前に個人情報を匿名化（メール, 電話, 住所, 名前）
- Firebase: コレクションレベル ACL（firestore.rules）
- API キー: localStorage保存（ブラウザ暗号化）、Anthropic はプロキシ経由
- Admin: メールホワイトリストでガード

## ローカル開発環境

```bash
npm install              # devDependencies インストール + husky 初期化
npm start                # ローカルサーバー起動（localhost:8080）
npm test                 # スモークテスト（70件）
npm run lint             # ESLint（worker/ tests/）
npm run format           # Prettier 自動修正
npm run format:check     # Prettier チェック
npm run lint:html        # HTML バリデーション
npm run worker:dev       # Cloudflare Worker ローカル起動
```

- `package.json` に全スクリプト定義。devDependencies のみ（プロダクションに影響なし）
- ESLint v9 flat config（`eslint.config.mjs`）、Prettier（`.prettierrc`）
- husky pre-commit フック: lint → format:check → test（コミット前に自動実行）
- Worker ローカル開発: `.dev.vars.example` をコピーして `.dev.vars` に API キーを設定
- 詳細は [docs/開発環境ガイド.md](docs/開発環境ガイド.md) を参照

## テスト

```bash
npm test                 # または: node tests/smoke.test.js
```

20カテゴリ・70件を検証: JS構文, onclick, レンダラー, 認証, AIエンジン, プロンプト, Google翻訳リンク, 写真アップロード, カレンダー, Plaud, 栄養, データエクスポート, Worker CORS, Firestoreルール, アクション推奨, モバイル安全性, 多言語, デプロイ設定, セキュリティ

## 管理者

- メール: `agewaller@gmail.com`
- 連絡先: `info@bluemarl.in`（CONFIG.CONTACT_EMAIL）
- 管理パネル（`/admin`）: プロンプト管理、API キー、Firebase 設定、データ管理
- `saveApiKeys` / `clearApiKeys` は `isAdmin()` ガードが必須
