# 画面遷移図

cares の主要画面と遷移を示す。

- [`screen-flow.md`](screen-flow.md) — Mermaid

## 画面 ID

| ID | 画面 | 関連機能 |
|---|---|---|
| SC-01 | ランディング / ログイン選択 | FN-AUTH-01〜04 |
| SC-02 | ダッシュボード (タイムライン) | FN-DIARY-04 |
| SC-03 | 記録入力 (9 カテゴリ + テキスト) | FN-DIARY-01〜03, 06 |
| SC-04 | 日々の解析結果 | FN-AI-01 |
| SC-05 | 会話型相談 (チャット) | FN-AI-03 |
| SC-06 | 医師提出レポート生成 | FN-AI-05 |
| SC-07 | 履歴 / 検索 | FN-DIARY-04, 05 |
| SC-08 | PubMed 論文検索 | FN-RES-01 |
| SC-09 | エクスポート | FN-INT-05 |
| SC-10 | 監査ログ閲覧 | FN-AUDIT-01 |
| SC-11 | 設定 (プロフィール / 通知 / 削除) | FN-PROF-01, FN-AUTH-07/08 |
| SC-12 | 管理画面 | FN-ADMIN-01〜07 |

## 関連ドキュメント

- 画面ワイヤ: [`../../design-system/screens/`](../../design-system/screens/)
- API 一覧: [`../../detail-design/api/api-list.md`](../../detail-design/api/api-list.md)
