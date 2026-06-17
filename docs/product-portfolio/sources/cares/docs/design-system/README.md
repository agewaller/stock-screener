# Design System — 画面 UI/UX 設計

cares の **画面 UI/UX 設計** を集約するパッケージ。要件 / 基本設計 / 詳細設計の 3 階層とは独立した「画面の見た目・状態・操作感」の観点をここにまとめる。

> 本パッケージのスコープは **画面設計中心 (軽量)**。デザイントークン (色・タイポ等)・コンポーネント仕様・UX リサーチは現時点では含めない。フェーズ 4 着手時に拡張する。

## ファイル構成

| ファイル / フォルダ | 内容 |
|---|---|
| [`information-architecture.md`](information-architecture.md) | サイトマップ・URL 設計・ナビゲーション体系・認証ガード |
| [`interaction-states.md`](interaction-states.md) | 全画面共通の Loading / Empty / Error / Success の表現規約 |
| [`screens/`](screens/) | 画面別の詳細仕様 (SC-ID ごとに 1 ファイル、SC-01〜12) |
| [`screens/_requests/`](screens/_requests/) | 指示者からの画面イメージ受け取り場所 (ワイヤ・希望・参考) |

## 他の設計階層との関係

| 既存ドキュメント | このパッケージでの扱い |
|---|---|
| [要件定義書 §4.1](../requirements/要件定義書.md) | FN-* 機能ID と画面の対応元。`screens/sc-XX-*.md` から参照 |
| [基本設計書 §1〜7](../basic-design/基本設計書.md) | 全体構成・テナント設計など上位文書。詳細は本パッケージへ誘導 |
| [詳細設計書 §1〜10](../detail-design/詳細設計書.md) | 画面項目・認可・暗号化等の技術視点。本パッケージは UI 視点で補完 |
| [画面遷移図](../basic-design/screen-flow/screen-flow.md) | 画面間のフロー。本パッケージは 1 画面の中身を扱う |
| [シーケンス図群](../basic-design/architecture/) | API 呼び出しタイミング。画面イベントの裏側はそちらを参照 |
| [状態遷移図](../detail-design/state/) | エンティティのライフサイクル。画面状態とは別軸 |

## デザイン原則 (cares 固有、変更時は要件定義書 / ADR に逆反映)

- **ペルソナ「平岡 みち子」 65 歳・主婦** (要件定義書 §3.3) を基準に設計
- **ライトテーマ固定** (BR-09: ダークテーマ追加禁止)
- **モバイルファースト** (PWA、iPhone 主体)
- **shadcn/ui + Radix UI + Tailwind** で a11y を確保 (ADR-0003)
- **「AI」リテラル不使用** (BR-09)、自然な日本語で代替 (「相談」「ひとこと」「ふりかえり」等)
- **`confirm()` / `alert()` 不使用**、インライン UI のみ (BR-08)
- 大きめのフォント・ボタン・タップ領域
- **PII を React state に残さない** (ADR-0007 / [project-cares-frontend メモリ参照]): Server Component で fetch して HTML に直書きするが、クライアント JS に長居させない

## 画面別 md のテンプレート

`screens/sc-XX-*.md` は次のセクションを持つ ([SC-03](screens/sc-03-record-entry.md) が代表例):

1. **関連** — 関連 FN-* / 関連シーケンス図 / 関連状態遷移図
2. **ASCII ワイヤ** — ローファイ表現 (1 画面に複数モード並べる)
3. **設計メモ** — 振る舞い・データの扱い・PII / 暗号化・コストキャップ等の運用ルール

将来必要に応じて以下のセクションを追加する:

- **画面項目**: 名前 / 型 / 必須 / 制約 のテーブル
- **イベント仕様**: トリガー / 動作 / 遷移先
- **状態 (States)**: Loading / Empty / Error / Success ごとの挙動 ([interaction-states.md](interaction-states.md) に準拠)
- **アクセシビリティ**: 見出し階層・キーボード操作・フォーカス順序

## 指示者から画面イメージを伝える方法

[`screens/_requests/README.md`](screens/_requests/README.md) を参照。会話に ASCII ワイヤを貼る / `_requests/` に書く / ローカル画像を Read で渡す の 3 方式を併用。
