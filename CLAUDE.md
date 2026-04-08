# 未病ダイアリー（Mibyou Diary）

慢性疾患患者のための体調記録・情報整理ツール（SPA, vanilla JS）。
サイト: https://cares.advisers.jp

## ビルド & デプロイ

```bash
python3 build_inline.py          # JS/CSS → index.html + dashboard.html にインライン統合
git add js/ css/ index.html dashboard.html
git commit -m "変更内容"
git push origin main             # → GitHub Pages 自動デプロイ
```

ビルド順序（依存順）:
config → store → ai-engine → affiliate → components → i18n → calendar → integrations → firebase-backend → app → pages

**新しいJSファイルを追加したら `build_inline.py` の `js_files` リストに追加すること。**

## 検証

```bash
node tests/smoke.test.js         # 69個の回帰テスト
```

テストが通らない変更はコミットしない。テストは以下をカバーする:

- **JS構文**: 全ファイルの構文エラー検出
- **ビルド出力**: index.html と dashboard.html の整合性、全モジュール同梱
- **セキュリティ**: APIキー/電話番号/メール/個人名のハードコード検出
- **モバイル互換**: `confirm()`/`alert()`/`localStorage.clear()`/`signInWithRedirect` 禁止
- **レンダラー契約**: `render_*` 関数からの `navigate()` 呼び出し禁止
- **キャッシュ無効化**: 疾患変更時の `cachedResearch`/`cachedActions`/`latestFeedback` クリア
- **プロンプト整合性**: `{{PLACEHOLDER}}` と `interpolatePrompt` の対応
- **AI表記隠し**: ユーザー向けレンダラーに「AI」リテラル禁止
- **管理者権限**: `saveApiKeys`/`clearApiKeys` の `isAdmin()` チェック、global config 書き込み
- **永続化契約**: `persistKeys` への必須キー登録、`clearAll()` の Firebase 設定保護

新しいバグを踏んだら、再発防止のため対応するテストを追加すること。

## ファイル構造

| ファイル | 役割 |
|---------|------|
| `js/config.js` | 疾患定義、全プロンプト（PROMPT_HEADER + 34件）、INLINE_PROMPTS |
| `js/app.js` | メインロジック（ナビ、フォーム、API呼び出し、レンダリング） |
| `js/pages.js` | 全画面レンダラー（login, dashboard, settings 等） |
| `js/ai-engine.js` | AI API呼び出し（OpenAI/Anthropic/Google + PubMed） |
| `js/store.js` | localStorage 永続化 |
| `js/firebase-backend.js` | Firebase Auth + Firestore |
| `css/styles.css` | 全スタイル（ライトテーマ固定） |
| `worker/anthropic-proxy.js` | Cloudflare Worker（Claude APIプロキシ） |
| `build_inline.py` | ビルドスクリプト |

## 絶対にやってはいけないこと

- `index.html` / `dashboard.html` を直接編集しない（ビルドで上書きされる）
- ダークテーマの CSS を追加しない（`:root` はライトテーマ固定）
- `localStorage.clear()` を使わない（`store.clearAll()` を使う。Firebase設定が消える）
- `confirm()` / `alert()` を使わない（モバイルでブロックされる。インラインUIにする）
- `signInWithPopup` をモバイルで使わない（`signInWithRedirect` を使う）
- APIキー・Firebase設定をコードにハードコードしない（管理パネル経由で設定）
- 管理者メール `agewaller@gmail.com` を削除しない

## コーディング規約

- フレームワークなし（vanilla JS のみ）
- テンプレートリテラルで HTML を返す（JSX なし）
- AI の応答内容はすべてプロンプト（config.js）で制御。JS にハードコードしない
- ユーザー向けテキストは日本語。専門用語を避ける（ペルソナ: 65歳女性）
- URL の正規表現は ASCII のみ（日本語文字を巻き込まない）
- 関数名: camelCase。CSS クラス: kebab-case

## 管理者

- メール: `agewaller@gmail.com`
- 管理パネル（`/admin`）: プロンプト管理、APIキー、Firebase設定、データ管理
