# ドメインクラス図

cares のドメイン概念を整理した図。ER 図 ([../er/er.md](../er/er.md)) より抽象度を上げ、暗号化や監査などの技術的属性はある程度省略してドメイン本体に集中する。

| 図 | 形式 | 用途 |
|---|---|---|
| [data-model.md](data-model.md) | Mermaid | GitHub レンダリング、ざっくり把握 |
| [data-model.puml](data-model.puml) | PlantUML | package・aggregation/composition 等を細かく表現 |

## PlantUML レンダリング

```bash
brew install plantuml
plantuml -tsvg docs/basic-design/data-model/data-model.puml
```

オンライン: <https://www.plantuml.com/plantuml> にソースを貼り付け。

## クラス分割の方針

- `User` を継承元として `AnonymousUser` / `AdminUser` を派生（実装はフラグやロールで判定するが、概念としては別役割）
- `HealthRecord` を抽象基底にして 9 カテゴリ + `TextEntry` + `PhotoRecord` を派生（実装はテーブル分割、共通属性のみ抽出）
- `Encrypted<T>` ジェネリクスでアプリ層 AES-GCM 暗号化対象を表現
- `<<view>>` ステレオタイプは「実体は別の場所、UI 表示用のビュー」を意味（例: `SecretStatus` の鍵値は Secret Manager にあり、これは設定済フラグのみ）

## 関連ドキュメント

- ER 図 (物理寄り): [`../er/`](../er/)
- DB スキーマ詳細: [`../er/schema.md`](../er/schema.md)
- 詳細設計書: [`../../detail-design/詳細設計書.md`](../../detail-design/詳細設計書.md)
