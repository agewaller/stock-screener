# SC-08 PubMed 論文検索

FN-RES-01。慢性疾患の最新研究を検索 → AI で日本語要約 → セルフ学習に活用。

## 関連

- FN-RES-01 (PubMed)
- ADR-0006 (AI プロバイダ)、BR-20 (コストキャップ)
- 旧仕様の `ai-engine.js` (PubMed 連携) からの継続

## ASCII ワイヤ

```
+--------------------------------------------------+
|  ← 戻る           論文を探す                     |
+--------------------------------------------------+
|                                                  |
|  キーワード:                                       |
|  ┌────────────────────────────┐ [🔍 検索]      |
|  │ fibromyalgia sleep           │                |
|  └────────────────────────────┘                  |
|                                                  |
|  または、自分の疾患から:                            |
|  [線維筋痛症] [慢性疲労症候群] [Long COVID]        |
|        ●                                          |
|                                                  |
|  ──── 検索結果 (12 件) ────                       |
|                                                  |
|  ① Sleep disturbance in fibromyalgia: a 2026     |
|     systematic review                            |
|     Journal of Pain Research, 2026/03            |
|                                                  |
|     [日本語要約を生成]  ← FN-RES-01 + AI         |
|                                                  |
|  ② Cognitive Behavioral Therapy for Insomnia    |
|     in Chronic Pain Patients                     |
|     Sleep Medicine, 2025/12                      |
|                                                  |
|     [日本語要約を生成]                            |
|                                                  |
|  ... (中略) ...                                   |
|                                                  |
|  キャッシュ済の要約は次回も同じ結果が表示されます    |
|  (7 日間有効)                                      |
|                                                  |
+--------------------------------------------------+
```

## 設計メモ

- `cached_research` テーブルに query_hash でキャッシュ (TTL 7 日)
- 要約は別途 AI 呼び出し → ai_usage_logs に記録 (FN-AI-* と同じコストキャップ判定)
- 日本語要約は audience: 「患者本人 (一般人)」プロンプトで、専門用語を避ける (BR-09 と整合)
- 「次に何ができそうか」の提案を 1 行つける (ADR-0013 S-7、cognition-shifting)
- 論文本文は外部リンク (PubMed)、新タブで開く
