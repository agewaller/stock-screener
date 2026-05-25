# ER 図（Firestore 論理データモデル）

本ディレクトリは Firestore に保管されるコレクションの論理 ER 図を保持する。

- [er.mmd](er.mmd) — 主要コレクションの関係（Mermaid）

## ER 図の前提

- Firestore はドキュメント DB なので RDB の「外部キー」相当は **参照（DocumentReference / path）** で表現する
- サブコレクションは親ドキュメントとの **集約（composition）** 関係
- `inbox/{hash}/...` は `users/{uid}` とは別エンティティだが、論理的に `hash` 経由でユーザを指す

## 参照

- [基本設計書 §6 データベース基本設計](../基本設計書.md#6-データベース基本設計)
- [詳細設計書 §4 データベース詳細設計](../../detail-design/詳細設計書.md#4-データベース詳細設計)
