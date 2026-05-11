# 健康日記（Health Diary）システムアーキテクチャ

## 概要
慢性疾患患者のための体調記録・情報整理ツール。日本発、全世界対応。
- **サイトURL**: https://cares.advisers.jp
- **リポジトリ**: github.com/agewaller/stock-screener (mainブランチ)
- **運営**: シェアーズ株式会社
- **管理者**: agewaller@gmail.com
- **連絡先**: info@bluemarl.in

---

## プラットフォーム構成

### 1. GitHub Pages（フロントエンド）
- **役割**: 静的HTMLサイトのホスティング
- **デプロイ**: mainブランチへのpushで自動デプロイ（GitHub Actions）
- **ドメイン**: cares.advisers.jp（CNAMEで設定済み）
- **変更方法**: このリポジトリのコードを編集→push

### 2. Firebase（認証・データベース）
- **プロジェクトID**: care-14c31
- **コンソール**: https://console.firebase.google.com/project/care-14c31
- **Authentication**: Googleログイン（OAuth2）+ メール/パスワード
- **Firestore**: ユーザーデータのクラウド保存（東京リージョン）
- **承認済みドメイン**: cares.advisers.jp, agewaller.github.io
- **変更方法**: Firebase Console（ブラウザ）で手動。設定値は index.html 内の CONFIG.firebase に埋め込み済み

### 3. Cloudflare Workers（APIプロキシ + メール受信）

#### anthropic-proxy（CORS プロキシ）
- **Worker名**: stock-screener
- **URL**: https://stock-screener.agewaller.workers.dev
- **役割**: ブラウザ→Anthropic Claude APIのCORSプロキシ
- **認証**: `x-api-key` ヘッダーまたは `ANTHROPIC_API_KEY` 環境変数
- **設定**: wrangler.toml

#### plaud-inbox（メール受信）
- **役割**: Plaud 文字起こしメール受信 → Firestore 保存
- **受信アドレス**: `plaud-{hash}@inbox.cares.advisers.jp` / `data-{hash}@...`
- **処理**: RFC 5322 パーサー（multipart/MIME, quoted-printable, base64 対応）
- **保存先**: Firestore `inbox/{hash}/{kind}/{messageId}`
- **設定**: wrangler.plaud-inbox.toml

### 4. 外部API
- **OpenAI GPT-4o**: ブラウザから直接呼び出し（CORS不要）
- **Anthropic Claude**: Cloudflare Worker経由で呼び出し
- **Google Gemini 2.5 Pro**: ブラウザから直接呼び出し
- **PubMed（NCBI E-utilities）**: ブラウザから直接呼び出し（CORS不要）
- **APIキー管理**: 管理パネルで設定→localStorage + Firestore保存

### 5. DNS（ドメイン）
- **ドメイン**: advisers.jp（サブドメイン cares を使用）
- **DNS設定**: CNAME cares → agewaller.github.io
- **変更方法**: ドメイン管理サービスで手動

---

## ファイル構成

```
stock-screener/
├── index.html                 # 本番SPA（HTML/CSS/JS 全てインライン、18,108行）
├── CNAME                      # cares.advisers.jp
├── CLAUDE.md                  # 開発ガイド
├── SYSTEM_ARCHITECTURE.md     # このファイル
├── firestore.rules            # Firestoreセキュリティルール
├── firebase.json              # Firebase設定
├── wrangler.jsonc             # Cloudflare Worker設定（メイン）
├── wrangler.toml              # Cloudflare Worker設定（anthropic-proxy）
├── wrangler.plaud-inbox.toml  # Cloudflare Worker設定（plaud-inbox）
├── sitemap.xml                # SEO サイトマップ
├── robots.txt                 # クローラー設定
├── og-image.svg / og-image.png # OGP画像
│
├── long-covid.html            # LP: Long COVID
├── fibromyalgia.html          # LP: 線維筋痛症
├── depression.html            # LP: うつ病
├── pots.html                  # LP: POTS
├── mcas.html                  # LP: MCAS
├── eds.html                   # LP: EDS
├── insomnia.html              # LP: 不眠症
│
├── .well-known/
│   └── security.txt           # セキュリティ連絡先
│
├── .github/workflows/
│   ├── pages.yml              # GitHub Pagesデプロイ
│   ├── deploy-worker.yml      # Cloudflare Workerデプロイ（2ジョブ）
│   └── deploy-firestore-rules.yml # Firestoreルールデプロイ
│
├── worker/
│   ├── anthropic-proxy.js     # Cloudflare Worker（Anthropic APIプロキシ）
│   └── plaud-inbox.js         # Cloudflare Email Worker（Plaud受信）
│
├── tests/
│   └── smoke.test.js          # スモークテスト（20+カテゴリ）
│
└── docs/                      # マーケティング・法務文書
    ├── README.md
    ├── プライバシーポリシー.md
    ├── 3省2GL準拠宣言.md
    ├── Pマーク準備チェックリスト.md
    ├── プレスリリース_2026年4月版.md
    ├── プレスキット.md
    ├── PR_TIMES_担当者向け.md
    ├── 患者会依頼メール.md
    ├── 寄稿ピッチ_医療メディア.md
    ├── SEO戦略_MECFS_1位獲得プラン.md
    ├── SNS投稿テンプレート.md
    ├── X開設キット.md
    ├── 即実行プレイブック.md
    ├── 成長戦略.md
    ├── 世界患者数一覧.md
    └── note連載下書き_01〜03.md
```

---

## index.html 内部構造（セクション別行範囲）

| # | セクション | 行範囲 | 行数 | 内容 |
|---|-----------|--------|------|------|
| 1 | HEAD | 1-414 | 414 | meta, SEO, OG, JSON-LD, CDN script tags |
| 2 | CSS | 415-1604 | 1,190 | 全スタイル（ライトテーマ固定、:root変数） |
| 3 | HTML Body | 1608-2023 | 416 | サイドバー、ナビゲーション、ランディングブロック |
| 4 | CONFIG | 2029-3608 | 1,580 | APP定数、疾患定義(80+)、Firebase設定、AI_MODELS |
| 5 | UNIVERSAL_PROMPTS | 3439-3610 | 172 | 汎用プロンプト5件（daily/weekly/monthly/mental/export） |
| 6 | DISEASE_PROMPTS | 3611-3899 | 289 | 疾患別プロンプト60+件（15疾患×3-4種） |
| 7 | INLINE_PROMPTS | 3908-4724 | 817 | リアルタイム分析プロンプト20+件 |
| 8 | Store | 4732-5063 | 332 | 状態管理 + localStorage永続化 |
| 9 | Privacy | 5085-5125 | 41 | PII匿名化（メール/電話/住所/名前） |
| 10 | AIEngine | 5133-6235 | 1,103 | MODEL_MAP + AI呼び出し + プロンプト展開 |
| 11 | AffiliateEngine | 6245-6440 | 196 | 商品レコメンド + トラッキング |
| 12 | Components | 6452-6937 | 486 | UI部品（カード、ゲージ、escapeHtml等） |
| 13 | I18n | 6944-7125 | 182 | 国際化（~200 UI文字列） |
| 14 | CalendarIntegration | 7136-7570 | 435 | Google Calendar同期 |
| 15 | Integrations | 7578-8531 | 954 | Plaud/Apple Health/Fitbit/PubMed/CSV |
| 16 | FirebaseBackend | 8539-9435 | 897 | Auth + Firestore CRUD + 同期 |
| 17 | App | 9442-14561 | 5,120 | メインロジック（ナビ、フォーム、API） |
| 18 | Page Renderers | 14572-17349 | 2,778 | 13画面レンダラー |
| 19 | Event Init | 17543-18101 | 559 | DOMContentLoaded + イベントリスナー |

---

## ビルドプロセス

**ビルド工程は存在しない**。`index.html` が唯一のソースかつ成果物。
編集は直接 `index.html` に対して行う。

---

## 認証・権限

### ユーザー認証
- Firebase Auth（Googleログイン + メール/パスワード）
- モバイル: `signInWithRedirect`、デスクトップ: `signInWithPopup`
- ローカルモード（Firebase未接続時はlocalStorage）

### 管理者
- メール: agewaller@gmail.com（ハードコード + localStorage拡張可能）
- 管理者専用ページ: 管理パネル（admin）
- 管理者のみ表示: AIモデル選択、プロンプト管理、APIキー、Firebase設定
- 保護メソッド: `saveApiKeys()`, `clearApiKeys()`, `savePromptsToAdmin()`, `resetPromptsToDefault()`, `exportData()`, `deleteAllData()`

### Firestoreデータ構造
```
users/{uid}/
├── profile: { age, gender, height, weight, location, language, notes, ... }
├── settings: { selectedDisease, selectedDiseases, selectedModel, customPrompts, ... }
├── adminEmails: [...]
├── secrets/apikeys: { anthropic, openai, google }
├── textEntries/: { id, timestamp, category, content, title, ... }
├── symptoms/: { id, timestamp, fatigue_level, pain_level, ... }
├── vitals/: { id, timestamp, heart_rate, temperature, ... }
├── sleep/: { id, timestamp, duration, ... }
├── activity/: { id, timestamp, steps, ... }
├── medications/: { ... }
├── nutrition/: { ... }
├── photos/: { id, filename, type, size, ... }
├── conversations/: { role, content, timestamp, ... }
└── analysisHistory/: { timestamp, model, summary, ... }

inbox/{hash}/
├── plaud/{messageId}: { ... }   ← Email Worker経由
└── data/{messageId}: { ... }
```

---

## AI分析アーキテクチャ

### 設計原則
- **プログラム（JS）= API呼び出し + 画面表示のみ**
- **プロンプト（CONFIG）= 表示内容の全ロジック**
- **MODEL_MAP**: CONFIG の AI model id → 実際の API model id を動的マッピング（ハードコード禁止）

### プロンプト構造

#### UNIVERSAL_PROMPTS（5件）
- `universal_daily` — 5層臨床推論（生化学/免疫/内分泌/腸脳/心理社会）
- `universal_weekly` — 7日間トレンド分析
- `universal_monthly` — 月次集計
- `mental_assessment` — メンタルヘルス評価
- `export_preparation` — GDPR準拠エクスポート

#### DISEASE_PROMPTS（60+件）
- 15-20疾患 × 3-4プロンプト（daily/research/pacing等）
- 例: mecfs_daily, fibromyalgia_daily, long_covid_research, pots_pacing

#### INLINE_PROMPTS（20+件）
- `text_analysis` — メイン日次入力分析（7点モニタリングフレームワーク）
- `image_analysis` — Vision API（7画像タイプ分類: food/blood_test/prescription/supplement/device/body/medical_doc）
- `prescription_detailed` — 4段階薬剤分析
- `blood_test_deep` — 5段階検査結果分析
- `medical_doc_complete` — 6段階医療文書読解
- `food_nutrition` — 食事写真→PFC/カロリー/BMR/抗炎症スコア
- `timeline_insight` — チャートパターン検出
- `plaud_analysis` — 音声文字起こし分析
- `research_scholar` — PubMed集約
- その他: sleep_analysis, activity_analysis, supplement_analysis 等

### API呼び出しフロー
```
ユーザー入力
  ↓
analyzeViaAPI(input, type, options)
  ↓
INLINE_PROMPTS[type] をテンプレート展開（{{VARS}}）
  ↓
aiEngine.callModel(model, prompt, options)
  ↓
OpenAI GPT-4o（直接） / Anthropic Claude（プロキシ経由） / Google Gemini（直接）
  ↓
JSON/テキストレスポンス
  ↓
renderAnalysisCard(result) → ダッシュボードに表示
```

---

## 画面構成（13画面）

### ユーザー向け画面
1. **ログイン** — 疾患選択 + メール/パスワード + Googleログイン
2. **疾患選択** — チェックボックス、検索、確認
3. **ダッシュボード** — クイック入力、AI分析、記録一覧、健康ゲージ、トレンド
4. **記録入力** — 9データカテゴリ（症状/バイタル/薬/睡眠/活動/栄養/血液検査/メンタル/写真）
5. **分析結果** — AI分析表示、所見、アクション、商品推奨
6. **アクション** — クリニック/イベント/商品/検査キット（10タイプ）
7. **研究** — PubMed検索、論文一覧
8. **チャット** — AIチャット、モデル選択、疾患コンテキスト
9. **タイムライン** — 時系列記録、詳細表示、編集/削除
10. **連携** — Plaud/Apple Health/Fitbit/Google Calendar/ファイルインポート
11. **設定** — 言語、疾患、AIモデル、プロキシURL、プライバシー
12. **プライバシー** — ポリシー、PII匿名化トグル、GDPR/CCPA、アカウント削除

### 管理者専用画面
13. **管理パネル** — APIキー管理、プロンプト編集（疾患別タブ）、データエクスポート/インポート、アフィリエイト設定

---

## 疾患別ランディングページ（7枚）

全ページ共通の構造:
- 日本語のみ（`<html lang="ja">`）
- SEO完備: title, description, keywords, OG, Twitter Card, canonical URL
- Schema.org: MedicalWebPage + MedicalCondition（ICD-11コード付き）
- CTA: `https://cares.advisers.jp/?d={disease}` でメインアプリへ誘導
- 相互リンク: 関連疾患ページへのフッターリンク

---

## アフィリエイト

### 設定済みネットワーク
- Amazon.co.jp: tag=forestvoice-22
- 楽天: tag=chroniccare
- iHerb: rcode=CHRONICCARE
- A8.net
- カスタム

### 動的商品推奨
- ユーザーの疾患・記録内容・体調スコアに基づくスコアリング
- 上位6件をダッシュボードに表示
- 日本製品優先

---

## セキュリティ

### 実装済み
- XSS防止: `Components.escapeHtml()` で全ユーザー入力をエスケープ
- PII匿名化: `Privacy.anonymizeText()` でAI送信前にマスク（メール/電話/住所/名前）
- Firebase ACL: コレクションレベルのセキュリティルール
- Admin保護: メールホワイトリスト + `isAdmin()` ガード
- Anthropicプロキシ: APIキーがブラウザに直接露出しない
- Inbox: 未認証はcreateのみ、認証済みはhashスコープでread/update

### CDNライブラリ
- Chart.js（バージョンピンなし、jsdelivr）
- Firebase v10.12.0（compat モード）
- Google Fonts（Inter, JetBrains Mono）

---

## 法的対応

### 実装済み
- プライバシーポリシー（要配慮個人情報対応）
- 利用規約（SaMD非該当明記）
- 免責事項（医療行為否定、緊急連絡先）
- アフィリエイト開示
- データ削除権
- プロンプト内安全表現（「〜が報告されています」形式）
- 3省2ガイドライン準拠宣言

### 未対応（要検討）
- Cookie同意バナー
- GDPR対応（EU向け）
- 具体的なデータ保持期間の明示
- 第三者監査
- アクセシビリティ（WCAG対応）

---

## ユーザーペルソナ

### メインペルソナ：65歳女性
- **デバイス**: スマホ（主にiPhone）、たまにPC
- **ITリテラシー**: LINEは使える、ブラウザの翻訳機能は知らない
- **視力**: 老眼あり（14px以上推奨）
- **操作**: タップは1本指、長押し・ドラッグは苦手
- **心理**: 不安が強い、専門用語は怖い、温かい言葉が欲しい
- **健康状態**: 慢性疾患を1つ以上抱えている

### UI/UX設計原則
1. 文字は大きく: 最小12px、本文14px以上
2. ボタンは大きく: タップ領域44px以上
3. 操作は1タップ: 長押し・ドラッグ不要
4. 専門用語を避ける
5. 色のコントラスト: 薄いグレーの文字を避ける
6. リンクは自動翻訳: ユーザーの言語でページが開く
7. エラーは優しく: 技術用語なし
8. 初回は手取り足取り: 3ステップで示す
9. 不安を消す: ディスクレーマーは必要だが脅さない
10. 継続の動機: 小さな改善を可視化し希望を持たせる
