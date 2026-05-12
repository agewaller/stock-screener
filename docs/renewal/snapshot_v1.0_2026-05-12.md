# 健康日記 現状凍結スナップショット v1.0

> **このドキュメントは「リニューアル直前の状態」を凍結したリファレンスです。**
> 以降の改修は本書を凍結タグとして扱い、新仕様は [`requirements_v2.0.md`](./requirements_v2.0.md)（作成予定）に記述します。

| 項目 | 値 |
|------|---|
| 凍結日 | **2026-05-12（JST）** |
| 凍結ブランチ | `yanoshin_work` |
| 凍結コミット | `6b4bfe3` (`docs: ブラウザ内ストレージ棚卸しを 5/11 時点に更新 + 差分ノート追加`) |
| アプリバージョン | `CONFIG.APP_VERSION = '1.0.0'` |
| サイト URL | https://cares.advisers.jp |
| 運営 | シェアーズ株式会社 |
| 連絡先 | info@bluemarl.in / 管理者 agewaller@gmail.com |

> 本書は **「リニューアル議論の起点となる事実」のみ** を抽出したサマリです。
> 詳細は一次資料（`docs/要件定義_機能設計.md` / `docs/データ構造.md` / `docs/ブラウザ内ストレージ棚卸し.md` / `SYSTEM_ARCHITECTURE.md` / `CLAUDE.md`）を参照してください。

---

## 1. プロダクト位置づけ

- 慢性疾患患者（80+ 疾患・ICD-11 紐付け）向けの体調記録・情報整理ツール
- **SaMD（医療機器プログラム）非該当** を明示。医療行為は行わず参考情報の提供と日記記録の整理に限定
- 全 AI 応答に「主治医と相談」のディスクレーマー付与
- メインペルソナ: **65 歳女性**（スマホ中心 / LINE は使える / 老眼あり / 専門用語が苦手）
- 対応言語: 12 言語（ja/en/zh/ko/es/fr/de/pt/th/vi/ar/hi）— UI も AI 応答も追従

---

## 2. プラットフォーム構成

| 層 | サービス | 役割 | 補足 |
|----|---------|------|------|
| フロント | GitHub Pages | 静的 SPA ホスティング | `agewaller/stock-screener` main / CNAME `cares.advisers.jp` |
| 認証 | Firebase Authentication | Google ログイン + Email/Password | mobile: `signInWithRedirect` 必須（popup 禁止） |
| DB | Firebase Firestore（東京） | クラウド DB | プロジェクト `care-14c31` |
| AI 中継 | Cloudflare Worker `stock-screener` (anthropic-proxy) | Claude API プロキシ | Cloudflare Access 保護中 |
| AI 中継（迂回） | Cloudflare Worker `cares-relay` | service binding で Access を回避 | 2026-05 新設、`worker/relay.js` |
| メール受信 | Cloudflare Email Worker `plaud-inbox` | Plaud 文字起こし受信 → Firestore | RFC 5322 / multipart 対応 |
| メール送信 | Cloudflare Worker `professional-mailer` | 専門家メール送信 | Resend → MailChannels フォールバック |
| PubMed | Cloudflare Worker `research-updater` | 週次 PubMed 要約 Cron + KV キャッシュ | 毎週日曜 03:00 UTC |
| 別プロダクト | Cloudflare Worker `learning-orchestrator` | 学習コンパニオン（別系統） | 本リニューアルの対象外 |
| 外部 AI | Anthropic / OpenAI / Google Gemini | LLM | Claude のみ Worker 経由、他はブラウザ直接 |
| 外部統合 | Google Fit / Fitbit / Apple Health / Google Calendar / Plaud | データ取込 | 各 OAuth トークンが localStorage に残置（後述） |

---

## 3. コードベース構成

ビルド工程なし。`index.html` (172,825 bytes ≒ 3.1K 行のシェル) が `<script src="js/...">` で 21 モジュールを依存順に読み込む。

### 3.1 JS モジュール（実測 約 20,263 行）

| モジュール | 行数 | 役割 |
|-----------|----:|------|
| `js/config.js` | 1,270 | CONFIG（疾患・AI モデル・カテゴリ・SEVERITY） |
| `js/prompts.js` | 1,850 | PROMPT_HEADER / UNIVERSAL / DISEASE / INLINE プロンプト |
| `js/store.js` | — | Store クラス + localStorage 永続化（`cc_*` 44 キー） |
| `js/privacy.js` | — | `Privacy.anonymizeText()` — AI 送信前の PII マスク |
| `js/ai-engine.js` | 918 | AIEngine + MODEL_MAP + PubMed |
| `js/affiliate.js` | — | AffiliateEngine + クリック CV ログ |
| `js/components.js` | 521 | UI ヘルパー（`escapeHtml` 含む） |
| `js/i18n.js` | — | 12 言語 + DOM 自動翻訳 |
| `js/calendar.js` | 442 | Google Calendar / ICS |
| `js/integrations.js` | 1,153 | Plaud / Fitbit / Apple Health / Google Fit / CSV |
| `js/firebase-backend.js` | 1,042 | Firebase Auth + Firestore（onSnapshot × 8 コレクション） |
| `js/app.js` | **7,006** | メインロジック（最大ファイル、ナビ / フォーム / API） |
| `js/pages.js` | 3,987 | 全画面レンダラー (render_*) |
| `js/idb.js` | — | IndexedDB（`images` / `largeData` / `pendingWrites`） |
| `js/analytics.js` 他 | — | a11y / アフィリパネル / 疾患 LP / ニュースレター / インアプリブラウザバナー / ソーシャル |

### 3.2 マーケティング / LP ファイル

- 疾患 LP 10 枚: `long-covid.html` / `fibromyalgia.html` / `depression.html` / `pots.html` / `mcas.html` / `eds.html` / `insomnia.html` / `ibs.html` / `hashimoto.html` / `me-cfs.html`
- マーケ系: `about.html` / `compare.html` / `pitch.html` / `enterprise-pitch.html` / `learning.html` / `faq/`

### 3.3 Worker 構成

| ファイル | wrangler config | デプロイ Worker 名 |
|---------|----------------|------------------|
| `worker/anthropic-proxy.js` | `wrangler.jsonc`（`main` フィールド必須） | `stock-screener` |
| `worker/relay.js` | `wrangler.relay.jsonc` | `cares-relay` |
| `worker/plaud-inbox.js` | `wrangler.plaud-inbox.toml` | `plaud-inbox` |
| `worker/professional-mailer.js` | `wrangler.professional-mailer.toml` | `professional-mailer` |
| `worker/research-updater.js` | `wrangler.research-updater.toml` | `research-updater` |
| `worker/learning-orchestrator.js` | `wrangler.learning.toml` | `learning-orchestrator`（別プロダクト） |

---

## 4. データレイヤ（リニューアル最重点）

### 4.1 永続化レイヤ全体図

| 層 | 用途 | 容量 | 実コード |
|----|------|----|---------|
| **メモリ（Store）** | 全画面の state | 揮発 | `js/store.js` |
| **localStorage** | state の自動同期 + 認証/設定/トークン | ~5–10MB | `js/store.js` (`cc_*`) + 直接アクセス |
| **IndexedDB** | 写真 dataURL + Firestore 書き込みキュー | ~50MB+ | `js/idb.js` |
| **Cache Storage** | 静的アセット | デプロイで更新 | `sw.js`（防御的に毎回 unregister） |
| **Firestore** | クラウド同期 | 無制限 | `js/firebase-backend.js` |
| **Cloudflare KV** | PubMed 疾患別要約 | per-key 25MB | `worker/research-updater.js` |
| **Cookie / sessionStorage** | **未使用** | — | Firebase Auth は IndexedDB 永続化 |

### 4.2 現状の「真値の所在」

| データ | 真値 | レプリカ | 同期方向 |
|--------|------|---------|---------|
| 健康記録 8 コレクション（textEntries / symptoms / vitals / sleep / activity / bloodTests / medications / conversations） | **localStorage（Store）** | Firestore | 双方向 realtime (`onSnapshot`, 2026-05-08 〜) |
| 設定（selectedDiseases / selectedModel / customPrompts / userProfile） | **localStorage** | Firestore (`/users/{uid}`) | 双方向 realtime |
| 認証情報（`cc_user`） | **localStorage** | Firebase Auth | Firebase Auth → localStorage |
| API キー 3 種（`apikey_anthropic` / `apikey_openai` / `apikey_google`） | **localStorage 平文（admin 投入）** | Firestore `/admin/config` | Firestore → localStorage 起動時降格 |
| OAuth トークン（fitbit / google_calendar / google_fit / plaud_email / ics_calendar_url） | **localStorage** | なし | per-device |
| 写真 dataURL | **IndexedDB `images`** | なし（Firestore に保存しない明示ルール） | per-device |
| AI 分析履歴 | **localStorage** (`cc_analysisHistory` max 100) | 一部 Firestore `analyses` | 単方向 |
| API 課金ログ（`cc_apiUsage`） | **localStorage**（max 5000 件 ≈ 3ヶ月） | なし | per-device |
| PubMed 疾患別要約 | **Cloudflare KV** | localStorage `cc_cachedResearch` | Worker → クライアント |

> **構造的な含意**: 現状は「localStorage が真値・Firestore がレプリカ」。
> 端末 A の書き込みが端末 B の Store に反映される realtime 同期は存在するが、
> **API キー・OAuth トークン・写真・分析履歴・API 課金ログ・PubMed キャッシュ等は per-device のまま**。
> ログアウト時に致命的キーが残置される構造（後述 §4.5）。

### 4.3 localStorage キー全件（`cc_*` Store 経由）

`Store.PERSIST_KEYS` 44 キー（一部抜粋）:

- 認証 / UI: `user` / `isAuthenticated` / `theme` / `selectedDisease` / `selectedDiseases` / `customDiseaseName` / `selectedModel` / `customPrompts` / `dashboardLayout`
- 健康記録: `symptoms` / `vitals` / `bloodTests` / `medications` / `supplements` / `meals` / `sleepData` / `activityData` / `photos`（メタのみ）/ `textEntries` / `nutritionLog` / `plaudAnalyses` / `calendarEvents`
- AI: `latestAnalysis` / `analysisHistory` / `latestFeedback` / `latestFeedbackError` / `recommendations` / `actionItems` / `aiComments` / `conversationHistory` / `deepAnalyses` / `deepAnalysisLastRun` / `doctorReports` / `cachedResearch` / `cachedActions` / `researchQuery` / `researchDays` / `researchResults` / `healthScore`
- メタ: `apiUsage` / `applicationLog` / `globalProfessionals` / `userProfile` / `integrationSyncs` / `affiliateConfig` / `schema_version`

### 4.4 localStorage キー（Store 外・直接アクセス）

| 種別 | キー |
|------|------|
| システム設定（device-shared） | `firebase_config` / `anthropic_proxy_url` / `anthropic_mode` / `enable_shared_guest_ai` / `admin_emails` |
| **API キー（admin 投入、全ユーザー共有・平文）** | `apikey_anthropic` / `apikey_openai` / `apikey_google` |
| **OAuth トークン（per-user, per-device）** | `fitbit_token` / `fitbit_refresh_token` / `fitbit_client_id` / `google_calendar_oauth_connected` / `google_calendar_access_token` / `google_calendar_token_expiry` / `ics_calendar_url` / `google_fit_token` / `google_fit_token_expiry` / `plaud_email` / `apple_health_last_import` |
| 個別フラグ | `cc_language` / `cc_errorLog` / `cc_affiliate_tracking` / `privacy_anonymize_ai` / `dismissed_inapp_banner` / `referrer_id` |

### 4.5 ログアウト時残置（`PRESERVE_KEYS`）

`store.js:373-394` の `PRESERVE_KEYS`。ログアウトしても消えない:

```
firebase_config / anthropic_proxy_url / anthropic_mode / admin_emails /
enable_shared_guest_ai / apikey_anthropic / apikey_openai / apikey_google /
ics_calendar_url / google_calendar_oauth_connected /
fitbit_token / fitbit_client_id / fitbit_refresh_token /
apple_health_last_import / plaud_email
```

> **2026-05-09 で `signOut()` から `store.clearAll()` を明示呼出するように改善**されたが、
> PRESERVE_KEYS 自体は同一。Tier 1 致命的キーは依然残置される。
> 例外: `google_fit_token` は PRESERVE_KEYS に含まれず、`clearAll()` で消える設計（5/9 新規）。

### 4.6 IndexedDB（`health-diary` v1）

| Object Store | キー | 用途 | 状況 |
|--------------|-----|-----|------|
| `images` | `id` | 写真 base64 dataURL `{id, dataUrl, savedAt}` | 使用中（localStorage 容量回避） |
| `largeData` | `key` | 任意の大型 JSON | **未使用・削除候補** |
| `pendingWrites` | autoIncrement / `collection` | オフライン時の Firestore 書き込みキュー | 使用中 |

加えて Firestore SDK 自体が `enablePersistence()` で独自 IndexedDB キャッシュを取る（別物）。

### 4.7 Firestore 構造

```
/users/{uid}
  ├ profile / settings / email / displayName / photoURL
  ├ firstSeenAt / lastSeenAt（serverTimestamp）
  ├ adminEmails?（管理者のみ）
  ├ /textEntries / /symptoms / /vitals / /sleep / /activity
  │  /bloodTests / /medications / /conversations / /analyses
  │  （各 doc: {id, timestamp, createdAt: serverTimestamp, ...固有フィールド}）
  ├ /secrets/apikeys（レガシー: 個別 API キー）
  └ /private/calendar（events 配列）

/admin/config（管理者のみ書き込み、認証済み全員 read 可）
  { apiKeys, proxyUrl, selectedModel, anthropicMode, professionals, mailerUrl, mailerSenderName }

/inbox/{hash}/{kind='plaud'|'data'}/{messageId}
  （Email Worker 経由のみ create、認証済み hash 一致で read/update、delete 禁止）

# Worker 専用（Admin SDK のみ・クライアント禁止）
/learning_users/{uid}/... /prompts/.../versions/... /aiModes/{key}
/auditLogs/{id} /safetyEvents/{id}
```

`firestore.rules` で `uid == request.auth.uid` または `agewaller@gmail.com` を条件にコレクションレベルで制御。

---

## 5. 機能（13 画面）

### 5.1 ユーザー向け 12 画面

| # | 画面 | レンダラ | 主機能 |
|---|------|---------|-------|
| 1 | ログイン | `render_login` | 言語選択 / 疾患選択 / 公開ユーザー数 / Google ログイン / Email / ゲスト入力 |
| 2 | 疾患選択 | `render_disease_select` | カテゴリ別チェックボックス / 検索 |
| 3 | ダッシュボード | `render_dashboard` | ストリーク + バッジ / クイック入力 / AI 分析カード / 健康ゲージ / トレンド (Chart.js) / 商品推奨 |
| 4 | 記録入力 | `render_data_input` | 9 カテゴリの動的フォーム / 画像 (Vision) / CSV/JSON/XML インポート |
| 5 | 分析結果 | `render_analysis` | サマリ / 所見 / アクション / 商品推奨 |
| 6 | アクション | `render_actions` | 10 アクションタイプ / プロバイダーカード / アフィリエイト |
| 7 | 研究 | `render_research` | PubMed キーワード検索 / 論文一覧 |
| 8 | チャット | `render_chat` | AI 対話 / モデル選択 / 疾患コンテキスト自動付与 |
| 9 | タイムライン | `render_timeline` | 日付別記録 / 詳細表示 / **編集 / 削除**（5/9 追加） |
| 10 | 連携 | `render_integrations` | Plaud / Apple Health / Fitbit / Google Fit / Google Calendar / ファイルインポート |
| 11 | 設定 | `render_settings` | 言語 / 疾患 / AI モデル / Worker URL / アフィリ / PII 匿名化 |
| 12 | プライバシー | `render_privacy` | ポリシー / GDPR/CCPA / アカウント削除 |

### 5.2 管理者専用 1 画面

| # | 画面 | アクセス条件 |
|---|------|------------|
| 13 | 管理パネル `render_admin` | `isAdmin()` — `agewaller@gmail.com` または `admin_emails`。タブ: API キー / プロンプト / データ / アフィリエイト / AI モデル / ユーザー / **Firebase（Firestore ルール 1 タップデプロイ, 5/10 追加）** |

### 5.3 データ入力カテゴリ（9 種）

`symptoms` / `vitals` / `medication` / `sleep` / `activity` / `nutrition` / `blood_test` / `mental` / `photos`

### 5.4 重症度スケール

8 段階（0-7）: 無症状 / 軽度 / 軽〜中度 / 中度 / 中〜重度 / 重度 / 非常に重度 / 極めて重度

---

## 6. AI 設計

### 6.1 モデル一覧

| ID | モデル | プロバイダ | 接続 |
|----|--------|----------|------|
| `claude-opus-4-6` | Claude Opus 4.6 | Anthropic | **デフォルト**、Worker プロキシ経由 |
| `claude-sonnet-4-6` | Claude Sonnet 4.6 | Anthropic | Worker プロキシ経由 |
| `claude-haiku-4-5` | Claude Haiku 4.5 | Anthropic | Worker プロキシ経由 |
| `gpt-4o` | GPT-4o | OpenAI | ブラウザ直接 |
| `gemini-2.5-pro` | Gemini 2.5 Pro | Google | ブラウザ直接 |

datestamped model id（`claude-3-5-sonnet-20241022` 等）のハードコード禁止。`MODEL_MAP` 経由で解決。

### 6.2 プロンプト体系

3 層構造（合計 1,850 行 in `js/prompts.js`）:

- `PROMPT_HEADER`（全プロンプト共通） — 役割 / 安全基準 / 寄り添い / 新処方義務 / 14 軸ローテーション / OODA
- `UNIVERSAL_PROMPTS`（7 件） — `universal_daily` / `_weekly` / `_monthly` / `mental_assessment` / `export_preparation` / `sleep_analysis` / `nutrition_analysis`
- `DISEASE_PROMPTS`（60+ 件） — 15-20 疾患 × 3-4 プロンプト
- `INLINE_PROMPTS`（20+ 件） — `text_analysis` / `image_analysis`（7 画像タイプ自動分類）/ `prescription_detailed` / `blood_test_deep` / `medical_doc_complete` / `food_nutrition` / `timeline_insight` / `plaud_analysis` / `research_scholar` 他

### 6.3 処方ローテーション（14 軸）

`dayOfYear % 14` で日替り。nutrition / body / mind / supplement / sleep / test / hydration / light / frontline / community / specialist / biohack / eastern / knowledge。

### 6.4 ルーティング（5/10 インシデント後の最終仕様）

- 客側キーあり（`apikey_anthropic` ローカル） → ブラウザから直接 `api.anthropic.com`
- 客側キーなし → Worker 経由（`stock-screener` または `cares-relay`）
- **拒否検知ロジック（`isRefusal` / `gracefulFallback` / `REFUSAL_PREVENTION`）は意図的に全削除済**（「毎回同じ回答バグ」の原因だったため再導入しない方針）
- ME/CFS ペーシング等の静的テンプレートも復活しない方針

### 6.5 言語追従

`buildSystemPrompt()` + `callClaude()` がユーザー選択言語を system prompt に注入。UI と AI の両方が選択言語に追従。

---

## 7. 外部連携

| 連携 | 方式 | 認証 | データ流入先 |
|------|------|------|-------------|
| Google Calendar | OAuth | localStorage `google_calendar_*` | `cc_calendarEvents` |
| ICS Calendar | URL 取得 | localStorage `ics_calendar_url` | `cc_calendarEvents` |
| Plaud（音声） | A: 手動貼付 / B: Email Worker 経由 → Firestore `/inbox/` | per-user `plaud_email` | `cc_plaudAnalyses` |
| Apple Health | XML/JSON ドロップ | なし（ローカル処理） | `cc_vitals` / `cc_sleepData` / `cc_activityData` |
| Fitbit | OAuth | localStorage `fitbit_token` / `fitbit_refresh_token` | `cc_vitals` / `cc_sleepData` / `cc_activityData` |
| Google Fit（5/9 新規） | OAuth | localStorage `google_fit_token`（PRESERVE 外） | `cc_vitals` / `cc_sleepData` / `cc_activityData` |
| PubMed | NCBI E-utilities 直接 | なし | `cc_cachedResearch`（24h） / Worker KV |
| ファイル | CSV/JSON/XML 自動判別 | なし | 全カテゴリ |

---

## 8. アフィリエイト

| ネットワーク | 識別子 |
|------------|--------|
| Amazon.co.jp | tag=**forestvoice-22**（2026-04-28 切替、旧 chroniccare-22） |
| 楽天 | tag=chroniccare |
| iHerb | rcode=CHRONICCARE |
| A8.net | （設定中） |
| カスタム | — |

10 アクションタイプ × 15 推奨検査キット。動的商品推奨は疾患・記録・体調スコアに基づきスコアリングし上位 6 件をダッシュボードに表示。日本製品優先。

---

## 9. 認証・権限

- ユーザー: Firebase Auth（Google OAuth + Email/Password）。モバイルは `signInWithRedirect`、PC は `signInWithPopup`
- ゲストモード: ログイン前でもダッシュボード入力可能
- 管理者: ハードコード `agewaller@gmail.com` + localStorage `admin_emails` で拡張可
- 保護メソッド: `saveApiKeys` / `clearApiKeys` / `savePromptsToAdmin` / `resetPromptsToDefault` / `exportData` / `deleteAllData`（すべて `isAdmin()` ガード）

---

## 10. セキュリティ / プライバシー（リニューアル主要動機）

### 10.1 実装済

| 対策 | 実装場所 |
|------|---------|
| XSS 防止 | `Components.escapeHtml()` |
| PII 匿名化（AI 送信直前のみ） | `Privacy.anonymizeText()` — メール / 電話 / 住所 / 名前 |
| Firebase ACL | `firestore.rules`（コレクションレベル） |
| Admin ガード | `isAdmin()` メールホワイトリスト |
| Anthropic API キー保護 | Cloudflare Worker プロキシ（直接露出しない経路がある） |
| Inbox セキュリティ | 未認証 create のみ、認証済み hash スコープで read/update、delete 禁止 |
| Service Worker 残骸対策（5/9） | `<body>` 直後で `serviceWorker.getRegistrations()` 全 unregister + Cache Storage 全削除 |

### 10.2 Tier 1 致命的問題（**全件未対応**、リニューアルの主動機）

> 詳細は [`docs/ブラウザ内ストレージ棚卸し.md`](../ブラウザ内ストレージ棚卸し.md) §0-2 / §2-B / §2-C / §6 を参照。

1. **LLM API キー 3 種が全ユーザー共有・平文・PRESERVE 残置**
   `apikey_anthropic` / `apikey_openai` / `apikey_google`（`firebase-backend.js:446-448` で Firestore `/admin/config` から起動時 localStorage へ降格、`store.js:381-383` で PRESERVE）。
   DevTools で誰でも生キーを読める → 即座に課金枠を奪える / ログアウトしても残置 / 共用端末で前ユーザーのキーが利用可能。

2. **個人 OAuth トークン残置**
   `fitbit_token` / `fitbit_refresh_token` / `google_calendar_oauth_connected` / `ics_calendar_url` / `apple_health_last_import` / `plaud_email`（`store.js:373-394` PRESERVE）。
   共用 PC・端末譲渡時に次の利用者が前ユーザーの Fitbit / Google Calendar に到達できる。

3. **医療 PII（要配慮個人情報）が暗号化なしの localStorage 平文**
   `cc_textEntries`（自由記述・音声書き起こし、PII 含有率最高）/ `cc_medications` / `cc_bloodTests` / `cc_symptoms` / `cc_vitals` / `cc_userProfile`。
   コード全体に `encrypt` / `cipher` / `WebCrypto` は **一切存在しない**。
   `Privacy.anonymizeText()` は AI 送信直前のみ作用、かつ `privacy_anonymize_ai` は既定 OFF。

### 10.3 Tier 2 深刻な問題（未対応）

- `cc_user` PII 平文（email / displayName / photoURL）
- `privacy_anonymize_ai` 既定 OFF（同意なしで生 PII が外部 LLM へ送信される導線）
- `cc_apiUsage`（max 5000 件）の肥大化 → QuotaExceededError で Store 全体の保存が止まる構造

### 10.4 Tier 3 構造的負債

- `cc_latestAnalysis` ⊆ `cc_analysisHistory[0]` の重複
- IndexedDB `largeData` ストアが未使用（削除候補）
- `cc_*` 命名が「Store 経由」と「Store 外」で混在し判別不能（`cc_language` / `cc_errorLog` / `cc_affiliate_tracking` は Store 外）
- カレンダーの真値が `cc_calendarEvents` + `ics_calendar_url` + `google_calendar_*` + Firestore `/users/{uid}/private/calendar` の 4 経路に分散

### 10.5 未対応（リニューアル本体ではないが残課題）

- Cookie 同意バナー
- GDPR 対応（EU 向け）の具体的な実装
- データ保持期間の明示
- 第三者監査
- アクセシビリティ（WCAG）

---

## 11. 重要な改訂イベント（2026-04-20 〜 2026-05-12）

詳細は `docs/update_logs/2026-05-11_main-merge_update_note.md` 参照。

| 日付 | 変更 |
|------|------|
| 2026-04-28 | Amazon アフィリエイトタグを `chroniccare-22` → `forestvoice-22` に切替（28 箇所） |
| 2026-05-04 | Worker プロキシの拒否検知（`isRefusal` / `gracefulFallback` 等）を**全削除**してパススルー化。`wrangler.jsonc` に `main` 追加（Worker が静的サイトとしてデプロイされていた致命的バグ修正） |
| 2026-05-05 | i18n 12 言語 + DOM 自動翻訳 + AI 応答言語追従 |
| 2026-05-08 | Firestore リアルタイム同期化（`onSnapshot` × 8 コレクション、orderBy 撤廃） |
| 2026-05-09 | Store DEFAULT_STATE 型安全化 + ログアウトデータ漏洩 fix + 記録の編集 / 削除 UI + Google Fit 連携追加 + Service Worker 自動 unregister |
| 2026-05-10 | AI 接続障害シリーズ HOTFIX 連鎖（PR #31 撤回で「客側キーあり → 直接 / なし → Worker」へ復元）+ 管理画面 Firestore ルール 1 タップデプロイ |
| 2026-05-10 | `cares-relay` Worker 新設（service binding で Cloudflare Access を回避） |
| 2026-05-11 | 履歴消失問題（orderBy 除外）解消 + ブラウザ内ストレージ棚卸し更新 |

---

## 12. 既知の論点 / 引き継ぎ事項（リニューアル設計時に確認すべきこと）

1. **`switchUser(uid)` は撤去済** — 一度導入されたが PR #25（`40c7ec1` / `cca607c`）でデータ消失バグの原因として撤去。同一端末で別アカウントを使う際のデータ混在は未対策。
2. **AI ルーティング** — 「客側キーあり → 直接 / なし → Worker」。in-app ブラウザの CORS 制約は別途対処（`d12d669` で in-app 検出を拡張済）。
3. **Cloudflare Access** — stock-screener Worker は Access 保護継続。public 経路は `cares-relay` の service binding 経由が前提。
4. **拒否検知** — `gracefulFallback` / `isRefusalReply` 等は意図的に削除済。再追加提案があれば「毎回同じ回答バグ」の経緯を必ず確認。
5. **Service Worker** — 今後 PWA 化しない方針（cache-first のリスクが顕在化したため）。再導入する場合は network-first + 短い TTL を強制する設計が必要。
6. **API キー保存先** — Firestore `/admin/config` から localStorage への起動時降格は「クライアントから直接 LLM API を叩く」要件のために導入されている。リニューアル時、この降格自体をやめるなら、すべての LLM 呼び出しを Worker 経由に統一する必要がある。
7. **管理者専用ロジックの位置** — `agewaller@gmail.com` ハードコード + localStorage 拡張。これも device-shared 設定として localStorage に残っている。
8. **写真の保存場所** — 「Firestore に dataUrl を保存しない」明示ルール。Cloud Storage への移行は未検討。
9. **ゲストモード** — 未ログインでもダッシュボード入力可能な「ゲスト共有 AI」モードあり（`enable_shared_guest_ai`）。リニューアル後は「ログイン必須」にするか、ゲスト用の一時 Firestore レーンを別途用意するか要決定。
10. **マルチデバイス未対応の per-device データ** — 写真（IndexedDB）/ 分析履歴 / API 課金ログ / PubMed キャッシュ / OAuth トークン / API キー / 管理者拡張。全てサーバ側で扱うか個別判断必要。

---

## 13. 不変条件（リニューアルでも維持する制約）

CLAUDE.md より、引き継ぐ「やってはいけないこと」:

- ダークテーマ CSS を追加しない（`:root` ライトテーマ固定）
- `localStorage.clear()` を直接使わない（Firebase 設定が消える）→ **リニューアルで localStorage 自体を縮小する場合は再評価対象**
- `confirm()` / `alert()` を使わない（モバイル）
- `signInWithPopup` をモバイルで使わない
- API キー / Firebase 設定をコードにハードコードしない
- 管理者メール `agewaller@gmail.com` を削除しない
- Google 翻訳リンクは `translate.goog` サブドメイン形式
- Claude datestamped model id をハードコードしない（`MODEL_MAP` 経由）
- ユーザー向け文言に「AI」リテラルを混ぜない

---

## 14. リニューアル対象範囲（暫定）

**確定**: ブラウザローカル管理（localStorage 真値）→ サーバサイド DB 一元管理（Firestore 真値）への刷新。提供形態は現状維持（SPA on GitHub Pages, vanilla JS）。

**主要変更が見込まれる領域**:

- §4 データレイヤ全般（特に localStorage 廃止 / 縮小）
- §10.2 Tier 1 致命的問題 3 件の構造的解消
- §5.1 ⑪ 設定画面 / ⑫ プライバシー画面のデータ表示
- §7 OAuth トークン保持戦略（Fitbit / Google Fit / Google Calendar / Plaud）
- §6.4 AI ルーティング（API キー降格を維持するか）

**現状維持が見込まれる領域**:

- §1 プロダクト位置づけ / SaMD 非該当 / ペルソナ / 多言語
- §2 プラットフォーム構成（GitHub Pages / Firebase / Cloudflare Worker）
- §5.3 9 データ入力カテゴリ
- §6.2 プロンプト 3 層構造 / 14 軸ローテーション
- §8 アフィリエイト
- §13 不変条件
