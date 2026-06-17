# 状態遷移図

主要エンティティのライフサイクル。ソフト削除 → 30 日後ハード削除 (BR-06/21) の流れを各エンティティで具体化する。

| 図 | 対象 | 関連 FN |
|---|---|---|
| [text-entry-state.md](text-entry-state.md) | `text_entries` (テキスト記録) | FN-DIARY-03/05/06 |
| [ai-conversation-state.md](ai-conversation-state.md) | `ai_conversations` (AI 会話) | FN-AI-03 |
| [account-deletion-state.md](account-deletion-state.md) | `users` (アカウント) | FN-AUTH-07 |
| [draft-state.md](draft-state.md) | `drafts` (フォームドラフト) | FN-DIARY-06 |

## 共通原則

- ソフト削除中 (deleted_at IS NOT NULL) は通常クエリで除外 (Prisma middleware)
- 30 日間は復元可能 (BR-21)
- ハード削除は GC ジョブ (Cloud Run Jobs、毎日実行)
- すべての状態遷移は `audit_logs` に記録 (BR-13)
