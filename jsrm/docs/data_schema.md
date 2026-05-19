# データスキーマ

## /data/raw_events.json

```jsonc
{
  "events": [
    {
      "id": "string",                      // unique
      "date": "YYYY-MM-DD",
      "category": "taiwan_strait | ...",
      "title": "string",
      "summary": "string",
      "sourceName": "string",
      "sourceUrl": "string",
      "severity": 0..5,
      "confidence": 0..1,
      "status": "raw | reviewed | rejected",
      "tags": ["critical", ...],
      "collectedAt": "ISO 8601"
    }
  ]
}
```

## /data/daily_scores.json

`scripts/calculate_daily_score.ts` が生成する正本ファイル。
`scores` は日付昇順で格納される。

各要素：

```jsonc
{
  "date": "YYYY-MM-DD",
  "overallScore": 1.82,
  "level": 2,
  "categories": [{ "category": "...", "score": 1.5, "level": 2, "topEvents": [...] }],
  "trend1d": 0.42,
  "trend7d": 0.68,
  "trend30d": 0.91,
  "topDrivers": [ /* RiskEvent[] */ ],
  "generatedAt": "ISO 8601"
}
```

## /data/manual_events.csv

ヘッダ行：
`id,date,category,title,summary,sourceName,sourceUrl,severity,confidence,status,tags`

`tags` は `|` または `,` 区切り。

## /data/sources.json

参照ソース一覧。`/sources` ページが描画する。

## /data/weights.json

8 カテゴリの重み。合計＝1.0。

## /data/scoring_rules.yaml

人間が読むためのスコアリング規約。実装は `lib/scoring.ts`。
