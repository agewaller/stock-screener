# テーブル定義書

DDL ベースのテーブル定義。schema.md ([../../basic-design/er/schema.md](../../basic-design/er/schema.md)) の論理仕様を PostgreSQL DDL に落とした版。

- [`tables.md`](tables.md) — DDL 一式 (33 テーブル)

## 正本の階層

- 論理仕様 (人が読む正本): [`../../basic-design/er/schema.md`](../../basic-design/er/schema.md)
- DDL 正本 (人が読む正本): 本 `tables.md`
- 実装正本 (機械が使う): `packages/db/prisma/schema.prisma` (まだ placeholder、フェーズ 4 で展開)

3 つは内容を一致させる必要がある。schema.md の変更は tables.md と schema.prisma の両方に反映する。

## 関連

- ER 図: [`../../basic-design/er/er.md`](../../basic-design/er/er.md)
- 暗号化方針: [`../詳細設計書.md`](../詳細設計書.md) §2
- マイグレーション戦略: ADR-0004 / ADR-0013 S-4
