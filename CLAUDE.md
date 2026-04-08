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
node tests/smoke.test.js         # 構文チェック + 基本検証
```

テストが通らない変更はコミットしない。

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
