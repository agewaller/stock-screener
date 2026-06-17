# シーケンス: 日次ふりかえり (AI 分析)

FN-AI-01 (日々のふりかえり) + BR-20 (月次 1000 円キャップ)。[ADR-0006](../../adr/0006-ai-provider-strategy.md) (フォールバック禁止)。

```mermaid
sequenceDiagram
    autonumber
    actor U as ユーザ
    participant B as ブラウザ<br/>(AnalysisCard)
    participant API as Hono API
    participant DB as Cloud SQL
    participant SEC as DB Secret テーブル<br/>(secrets)
    participant ANT as Anthropic Claude

    U->>B: /timeline → 「今日のふりかえり」ボタン
    B->>API: POST /api/analysis/daily<br/>Bearer idToken

    API->>API: middleware で verifyIdToken<br/>+ 三段 admin 判定<br/>(該当なしで通常ユーザ)

    Note over API,DB: 1. quota チェック (BR-20)
    API->>DB: getMonthlyCostJpy(userId)<br/>(ai_usage_logs を SUM)
    DB-->>API: 月次累計 (JPY)
    alt 1000 円超過
        API-->>B: 422 ai_quota_exceeded<br/>{detail, monthlyCostJpy, monthlyCapJpy}
        B->>B: 「今月の上限に達しました」表示<br/>(フォールバックなし、ADR-0006)
    else 通常
        Note over API,SEC: 2. API キー取得 (DB Secret から)
        API->>SEC: getSecret("ANTHROPIC_API_KEY")
        SEC-->>API: api key (server-only)

        Note over API,DB: 3. ユーザ文脈収集
        API->>DB: fetchSymptomsForAnalysis(userId, 7 日)
        DB-->>API: Symptom[] (直近 7 日)
        API->>API: symptomsToContext() で Markdown 整形

        Note over API,DB: 4. プロンプト解決 (疾患カスケード)
        API->>DB: prisma.userPreferences<br/>selectedDiseases, selectedModel
        DB-->>API: prefs
        API->>DB: resolvePromptKey()<br/>{disease}_daily → universal_daily → daily_brief
        DB-->>API: PromptVersion (template)
        API->>API: interpolatePrompt()<br/>{{USER_DATA}} {{SELECTED_DISEASES}} {{DATE}} 等を展開

        Note over API,ANT: 5. AI 呼び出し
        API->>ANT: messages.create<br/>model: user の selectedModel<br/>(default: claude-haiku-4-5)<br/>system: 展開済テンプレ<br/>messages: [{role:"user", content: 「今日のふりかえりを書いてください」}]<br/>cache_control: ephemeral
        ANT-->>API: response (text + usage)

        Note over API,DB: 6. 記録
        API->>DB: prisma.analysis.create<br/>analysisType: "daily"<br/>result, modelUsed, inputTokens, outputTokens
        API->>DB: recordUsage<br/>provider, model, tokens, costJpy
        API->>DB: recordAudit (fire-and-forget)<br/>action: "write", targetTable: "analyses"
        API-->>B: { item: analysis }

        B->>B: 結果表示 (Markdown)
    end
```

## ポイント

- **quota チェックは API 内で最初に**: 失敗時は **422** を返してフォールバックなし ([ADR-0006](../../adr/0006-ai-provider-strategy.md) フォールバック連鎖禁止)。`monthlyCostJpy` / `monthlyCapJpy` を返してフロントが説明可能
- **API キーは DB の `secrets` テーブル** に保管 ([ADR-0011](../../adr/0011-admin-model-with-failsafe.md) のシークレット原則): ブラウザに絶対漏らさず、管理画面では `isSet: true/false` のみ返す。実装は `getSecret(name)` で server-only に閉じる
- **プロンプトは DB 駆動 + 疾患カスケード**:
  - ユーザの疾患選択を優先 (`{disease}_daily` → `mecfs_daily` 等の 135 件)
  - なければ `universal_daily`
  - それも無ければ `daily_brief` (短文版、フォールバック用)
  - 157 件すべて `prompts` テーブルに seed 済 (旧 stock-screener から移植)
- **モデルはユーザ選択**: `UserPreferences.selectedModel` (default: Haiku)。`AVAILABLE_MODELS` に無いと DEFAULT にフォールバック
- **interpolatePrompt の置換変数**: `{{RESPOND_LANGUAGE_INSTRUCTION}}` / `{{DATE}}` / `{{SELECTED_DISEASES}}` / `{{USER_DATA}}` (記録 markdown) / `{{PERIOD_DAYS}}` 等。旧 stock-screener の `ai-engine.js` 由来
- **prompt caching**: `cache_control: { type: "ephemeral" }` で system 部分をキャッシュ。同じ system prompt で複数ユーザ叩く時にコスト削減
- **monthly reset**: `firstDayOfThisMonthUTC()` で集計。UTC 月初リセット (BR-20)

## 関連エンドポイント

- `GET /api/analysis/today` — 当日の分析取得 (生成済みなら既存返却)
- `POST /api/analysis/daily` — 本シーケンス
- `POST /api/analysis/deep` — 深堀ふりかえり (1 日 1 回、`weekly` 系プロンプト使用)
- `POST /api/analysis/research` — 研究分析 (疾患固有 `{disease}_research` 必須)
- `POST /api/reports` — 医師 / SNS / 家族向けレポート (`report_doctor` 等の固定プロンプト)

## 実装参照

- `apps/api/src/index.ts` — `POST /api/analysis/daily` ハンドラ
- `apps/api/src/prompt-runtime.ts` — `getPromptText` / `resolvePromptKey` / `interpolatePrompt`
- `apps/api/src/legacy-prompts.json` + `extra-prompts.json` — 157 件のプロンプト seed
