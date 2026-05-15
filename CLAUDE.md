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
- Anthropic は Cloudflare Worker 経由（`anthropic_proxy_url` を localStorage に保存、未設定なら `https://ai.cares.advisers.jp`）
- `ai.cares.advisers.jp` は cares-relay Worker のカスタムドメイン（`wrangler.relay.jsonc` の `routes` で `custom_domain: true` 登録）。`*.workers.dev` のアカウントレベル無効化を回避するため、必ずこの独自ドメインを使う。`cares-relay.agewaller.workers.dev` / `stock-screener.agewaller.workers.dev` への直接アクセスはフォールバックとしてのみ残存
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

## 開発環境セットアップ

初回 clone 直後に一度だけ実行（ローカル設定のため clone ごとに必要）:

```bash
git config core.hooksPath .githooks
```

これで `.githooks/pre-commit` が有効化され、以下の禁則パターンを commit 時に自動検出する:

- datestamped Claude / OpenAI model id のハードコード
- `localStorage.clear()`
- `confirm()` / `alert()`
- `signInWithPopup`
- 旧 Google 翻訳 URL 形式
- ハードコードされた Google / Firebase API key（`AIza...`）

緊急 bypass（基本使わない）: `ALLOW_DANGEROUS=1 git commit ...`

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
| AI | Anthropic / OpenAI / Gemini | `js/ai-engine.js` + `worker/anthropic-proxy.js` |
| カレンダー | Google Calendar / ICS | `js/calendar.js` |
| ウェアラブル | Fitbit / Apple Health | `js/integrations.js` |
| メール受信 | Cloudflare Email Workers | `worker/plaud-inbox.js` |
| メール送信 | Cloudflare Worker | `worker/professional-mailer.js` |

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


## Claude Code向け追加指示（ユーザーデータの編集・削除権）

ユーザーが書き込み・更新した**すべてのデータ**について、ユーザー本人がいつでも編集・削除できることを必須要件とする。

- 対象データ: 日記本文、症状メモ、タグ、連携取り込みデータ、設定値、プロフィール、AI関連の保存結果など、ユーザー起点で生成/更新された全データ。
- UI要件: 各データに「編集」「削除」を常時提供し、複数階層の画面でも到達可能にする。
- API/DB要件: 編集（UPDATE）と削除（DELETE）の経路を必ず実装し、読み取り専用データに固定しない。
- 権限要件: Firestore ルール・バックエンド処理で「本人のみ編集/削除可能」を担保する。
- 同期要件: ローカル（localStorage/IndexedDB）とクラウド（Firestore）で削除状態を同期し、再同期で復活しないようにする。
- 監査要件: 削除操作の実行可否・失敗理由は開発者向けログに残し、ユーザー向けには平易な失敗メッセージを表示する。
- 例外禁止: 「一部データは削除不可」「管理者のみ削除可」を既定にしない。法令保存義務がある場合のみ、対象と保存期間をUI上で明示する。

実装・改修時は、必ず「この変更でユーザーが自分のデータをいつでも編集・削除できるか」をレビュー項目に含める。
