# 方法論（Methodology）

## 目的

公開情報に基づいて「日本が戦争・準戦時体制に巻き込まれる構造的リスク」を
定点観測する記帳システム。**予言ではない**。

## カテゴリと既定の重み

| カテゴリ | 重み |
|---------|------|
| taiwan_strait | 0.250 |
| senkaku_east_china_sea | 0.150 |
| china_russia_military | 0.100 |
| north_korea | 0.100 |
| us_japan_operational_integration | 0.150 |
| legal_political_activation | 0.100 |
| market_supply_chain | 0.075 |
| cyber_information_warfare | 0.075 |

合計＝1.0。重みは公開された固定値で、運営者が個別ニュースに合わせて変更しません。

## レベル定義

| Level | 名称 | 目安 |
|-------|------|------|
| 0 | 平時 | score < 0.5 |
| 1 | グレーゾーン | 0.5 ≤ score < 1.25 |
| 2 | 危機接近 | 1.25 ≤ score < 2.25 |
| 3 | 準有事 | 2.25 ≤ score < 3.25 |
| 4 | 参戦直前 | 3.25 ≤ score < 4.25 |
| 5 | 参戦・戦域化 | score ≥ 4.25 |

## 計算式

各イベントについて：

```
adjusted_severity = severity × confidence
category_score    = 0.65 × max(adjusted_severity) + 0.35 × avg(adjusted_severity)
overall_score     = Σ (category_score × category_weight)
```

`severity` は 0〜5、`confidence` は 0〜1（一次情報＝高、SNS＝低）。

## 不確実性

- 公開情報のみを集約。機密情報は反映されない
- センセーショナル報道は `confidence` を下げて記帳
- `status: "raw"` のイベントは目視レビュー前のため、本番表示では `reviewed` のみ集計
- 急上昇は注意喚起であり予言ではない
