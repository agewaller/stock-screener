# 画面ワイヤ (sc-XX-*.md)

ASCII テキストベースの画面ワイヤ。1 画面 1 ファイル。フェーズ 4 (スケルトン実装) で React コンポーネントに具体化する元データ。

## 画面一覧

| ID | 画面 | 主要機能 |
|---|---|---|
| [SC-01](sc-01-login.md) | ランディング / ログイン選択 + お試し分析 | FN-AUTH-01〜04, FN-TRIAL-01 |
| [SC-02](sc-02-dashboard.md) | ダッシュボード (タイムライン) | FN-DIARY-04, FN-AI-01 |
| [SC-03](sc-03-record-entry.md) | 記録入力 (9 カテゴリ + テキスト) | FN-DIARY-01〜03, 06 |
| [SC-04](sc-04-daily-analysis.md) | 日々の解析結果 | FN-AI-01〜02 |
| [SC-05](sc-05-ai-chat.md) | 会話型相談 (チャット) | FN-AI-03, 04, 09 |
| [SC-06](sc-06-doctor-report.md) | 医師提出レポート生成 | FN-AI-05〜07, FN-INT-05 |
| [SC-07](sc-07-history.md) | 履歴 / 検索 | FN-DIARY-04〜05 |
| [SC-08](sc-08-pubmed.md) | PubMed 論文検索 | FN-RES-01 |
| [SC-09](sc-09-export.md) | エクスポート | FN-INT-05 |
| [SC-10](sc-10-audit-log.md) | 監査ログ閲覧 | FN-AUDIT-01 |
| [SC-11](sc-11-settings.md) | 設定 (プロフィール / 通知 / 削除) | FN-PROF-01, FN-AUTH-05/07/08 |
| [SC-12](sc-12-admin.md) | 管理画面 | FN-ADMIN-01〜07 |

## 共通方針

- **ペルソナ 65 歳** (要件定義書 §3.3) に合わせて大きめのフォント・ボタン
- **ライトテーマ固定** (BR-09: ダークテーマ追加禁止)
- `confirm()` / `alert()` 不使用、インライン UI のみ (BR-08)
- 「AI」リテラルは UI に出さない (BR-09)、自然な日本語で代替
- 画面遷移は [`../../basic-design/screen-flow/screen-flow.md`](../../basic-design/screen-flow/screen-flow.md)

## 修正提案の出し方

参考リポ (yanoshin/AI-Assisted-System-design) の慣習に倣い、本ディレクトリ直下の `_requests/sc-XX.md` に積むか、会話で ASCII を直接渡す。詳細: [`_requests/README.md`](_requests/README.md)
