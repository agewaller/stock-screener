# 未病ダイアリー（Mibyou Diary）システムアーキテクチャ

## 概要
慢性疾患患者のための体調記録・情報整理ツール。日本発、全世界対応。
- **サイトURL**: https://cares.advisers.jp
- **リポジトリ**: github.com/agewaller/stock-screener (mainブランチ)
- **運営**: シェアーズ株式会社
- **管理者**: agewaller@gmail.com

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
- **Authentication**: Googleログイン（OAuth2）
- **Firestore**: ユーザーデータのクラウド保存（東京リージョン）
- **承認済みドメイン**: cares.advisers.jp, agewaller.github.io
- **変更方法**: Firebase Console（ブラウザ）で手動。設定値は index.html 内の CONFIG.firebase に埋め込み済み

### 3. Cloudflare Workers（APIプロキシ）
- **Worker名**: stock-screener
- **URL**: https://stock-screener.agewaller.workers.dev
- **役割**: ブラウザ→Anthropic Claude APIのCORSプロキシ
- **デプロイ**: GitHub Actions（.github/workflows/deploy-worker.yml）
- **APIトークン**: GitHubのSecrets（CLOUDFLARE_API_TOKEN）に保存済み
- **変更方法**: worker/anthropic-proxy.jsを編集→push→自動デプロイ

### 4. 外部API
- **OpenAI GPT-4o**: ブラウザから直接呼び出し（CORSOKいらない）
- **Anthropic Claude**: Cloudflare Worker経由で呼び出し
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
├── index.html              # 本番SPA（HTML/CSS/JS 全てインライン、これ 1 枚が全て）
├── CNAME                   # cares.advisers.jp
├── CLAUDE.md               # 開発ガイド
├── SYSTEM_ARCHITECTURE.md  # このファイル
├── firestore.rules         # Firestoreセキュリティルール
├── wrangler.jsonc          # Cloudflare Worker設定
├── wrangler.toml           # Cloudflare Worker設定
│
├── .github/workflows/
│   ├── pages.yml           # GitHub Pagesデプロイ（mainブランチ）
│   └── deploy-worker.yml   # Cloudflare Workerデプロイ
│
└── worker/
    └── anthropic-proxy.js  # Cloudflare Worker（Anthropic APIプロキシ）
```

## index.html 内部の <script> ブロック（依存順）

1. `CONFIG` — 疾患定義、全プロンプト(34件)、AI_MODELS、INLINE_PROMPTS、Firebase config
2. `Store` — 状態管理（localStorage 永続化、Firestore 同期フック）
3. `AIEngine` — OpenAI / Anthropic / Google + PubMed 呼び出し
4. `AffiliateEngine` — 商品レコメンド
5. `Components` — UI コンポーネント（カード、ゲージ、フォーム等）
6. `I18n` — 多言語対応
7. `CalendarIntegration`
8. `Integrations` — Plaud / Fitbit / Apple Health
9. `FirebaseBackend` — Firebase Auth + Firestore
10. `App` — メインロジック（ナビ、フォーム、API、レンダリング）
11. `App.prototype.render_*` — 全画面レンダラー

---

## ビルドプロセス

**ビルド工程は存在しない**。`index.html` が唯一のソースかつ成果物。
編集は直接 `index.html` に対して行う。

---

## 認証・権限

### ユーザー認証
- Firebase Auth（Googleログイン）
- ローカルモード（Firebase未接続時はlocalStorage）

### 管理者
- メール: agewaller@gmail.com（ハードコード + Firestore）
- 管理者専用ページ: 管理パネル（admin）
- 管理者のみ表示: AIモデル選択、プロンプト管理、APIキー、Firebase設定

### Firestoreデータ構造
```
users/{uid}/
├── settings: { selectedDisease, selectedDiseases, selectedModel, customPrompts, ... }
├── userProfile: { age, gender, height, weight, location, language, notes, ... }
├── adminEmails: [...]
├── secrets/apikeys: { anthropic, openai, google }
├── textEntries/: { id, timestamp, category, content, title, ... }
├── symptoms/: { id, timestamp, fatigue_level, pain_level, ... }
├── vitals/: { id, timestamp, heart_rate, temperature, ... }
├── sleep/: { id, timestamp, duration, ... }
├── activity/: { id, timestamp, steps, ... }
├── photos/: { id, filename, type, size, ... }
├── conversations/: { role, content, timestamp, ... }
└── analyses/: { timestamp, model, summary, ... }
```

---

## AI分析アーキテクチャ

### 設計原則
- **プログラム（JS）= API呼び出し + 画面表示のみ**
- **プロンプト（config.js）= 表示内容の全ロジック**

### プロンプト構造

#### PROMPT_HEADER（全プロンプト共通ヘッダー）
- 使命と安全基準（SaMD非該当、医療行為否定）
- 最先端医療知識ベース（免疫/神経/代謝/腸脳/デバイス/検査）
- 商品品質基準（第三者認証、吸収率、メーカー信頼性）
- 地域別イベントプラットフォーム（10地域対応）
- 会話データ分析フレームワーク
- 全データタイプ対応指針（40+カテゴリ）

#### DEFAULT_PROMPTS（34件）
UNIVERSAL_PROMPTS（7件）:
- universal_daily: 日次健康分析（臨床推論5層フレームワーク）
- universal_weekly: 週次レポート
- supplement_optimizer: サプリメント最適化
- sleep_analysis: 睡眠分析
- nutrition_analysis: 栄養分析
- mental_health: メンタルヘルス分析
- conversation_analysis: 会話データ分析

DISEASE_PROMPTS（27件）:
- 各疾患の日次分析 + 研究プロンプト
- ME/CFS, うつ病, 双極性障害, PTSD, ADHD, Long COVID,
  線維筋痛症, 甲状腺, 糖尿病, 自己免疫, IBS, POTS, 不眠症

#### INLINE_PROMPTS（6件 - リアルタイム分析用）
- text_analysis: テキスト入力時（BMR/PFC計算含む）
- image_analysis: 画像アップロード時（Vision API）
- conversation_analysis: Plaud文字起こし
- product_recommendations: 動的商品推奨
- action_recommendations: クリニック/イベント
- timeline_insight: タイムライン1行コメント

### API呼び出しフロー
```
ユーザー入力
  ↓
analyzeViaAPI(input, type, options)  ← app.js
  ↓
INLINE_PROMPTS[type]をテンプレート展開  ← config.js
  ↓
aiEngine.callModel(model, prompt, options)  ← ai-engine.js
  ↓
OpenAI GPT-4o（直接） or Anthropic Claude（プロキシ経由）
  ↓
JSON/テキストレスポンス
  ↓
renderAnalysisCard(result)  ← app.js
  ↓
ダッシュボードに表示
```

---

## データフロー

### ユーザーデータの保存先
| データ | localStorage | Firestore | 永続性 |
|--------|:-----------:|:---------:|:------:|
| 認証情報 | ✅ | ✅ | 高 |
| テキスト記録 | ✅ | ✅ | 高 |
| 症状データ | ✅ | ✅ | 高 |
| バイタル | ✅ | ✅ | 高 |
| 選択疾患 | ✅ | ✅ | 高 |
| ユーザープロフィール | ✅ | ✅ | 高 |
| AIモデル選択 | ✅ | ✅ | 高 |
| APIキー | ✅ | ✅(暗号化) | 高 |
| AI分析結果 | ✅ | 一部 | 中 |
| PubMedキャッシュ | ✅ | ❌ | 24h |
| カレンダー | ✅ | ❌ | 手動 |
| AIコメント | ✅ | ❌ | 中 |

---

## 画面構成

### ユーザー向け画面
1. **ホーム（ダッシュボード）** - 入力欄、AIフィードバック、記録一覧、おすすめ、研究、スケジュール
2. **記録** - テキスト入力（25カテゴリ）、ファイルアップロード、指標データ
3. **アクション** - クリニック/イベント、商品推奨、検査キット
4. **研究** - PubMed検索、論文一覧
5. **相談** - チャットインターフェース
6. **連携** - Plaud/Fitbit/Apple Health/Googleカレンダー
7. **設定** - プロフィール、疾患選択、データ管理

### 管理者専用画面
8. **管理パネル** - 6タブ構成:
   - プロンプト管理（34件、疾患別グループ、検索・フィルター）
   - AIモデル選択
   - APIキー設定（プロキシURL含む）
   - アフィリエイト設定
   - Firebase設定
   - データ管理（管理者ユーザー管理含む）

### ランディングページ
- サービス説明（何ができるか、医療行為ではない旨）
- 医療ディスクレーマー（赤枠警告）
- Googleログイン（CTA）
- 3ステップオンボーディング
- データ取り扱い説明
- プライバシーポリシー/利用規約/免責事項（モーダル）
- 体験談（note.comへのリンク）
- 言語選択（12言語）
- コピーライト（Shares Inc.）

---

## アフィリエイト

### 設定済みネットワーク
- Amazon.co.jp: tag=chroniccare-22
- 楽天: tag=chroniccare
- iHerb: rcode=CHRONICCARE

### 動的商品推奨（30+商品）
- ユーザーの疾患・記録内容・体調スコアに基づくスコアリング
- 上位6件をダッシュボードに表示
- 日本製品優先（漢方、5-ALA、NMN、OMRON、TANITA等）

---

## 法的対応

### 実装済み
- プライバシーポリシー（要配慮個人情報対応）
- 利用規約（SaMD非該当明記）
- 免責事項（医療行為否定、緊急連絡先）
- アフィリエイト開示
- データ削除権
- プロンプト内安全表現（「〜が報告されています」形式）

### 未対応（要検討）
- Cookie同意バナー
- GDPR対応（EU向け）
- 具体的なデータ保持期間の明示
- 第三者監査
- アクセシビリティ（WCAG対応）

---

## 既知の課題

1. **Claude API**: プロキシ設定済みだが接続テスト未確認
2. **旧JSハードコード関数**: generateDeepAnalysis等がまだ残存（INLINE_PROMPTSと並行）
3. **モバイル**: 一部画面で横スクロールが残る可能性
4. **ファイルアップロード**: 大きな画像のbase64送信でOpenAI APIのトークン制限に注意
5. **PubMed検索**: 疾患が未選択の場合、汎用検索になる
6. **Plaudメール受信**: サーバーサイド未実装（手動ペーストのみ）
7. **カレンダー同期**: MCP経由の手動同期のみ

---

## 新しいセッションへの引き継ぎ方法

新しいClaude Codeセッションで以下を伝えてください：

```
リポジトリ agewaller/stock-screener で「未病ダイアリー」の開発を続けます。
SYSTEM_ARCHITECTURE.md にシステム全体の構造が記載されています。
まずそれを読んでから作業してください。
```

### 変更手順
1. `index.html` を直接編集
2. `git add index.html && git commit && git push origin main`
3. GitHub Pages (pages.yml) が自動デプロイ

---

## ユーザーペルソナ（全プロダクト共通）

### メインペルソナ：65歳女性
- **年齢**: 65歳
- **性別**: 女性
- **デバイス**: スマホ（主にiPhone）、たまにPC
- **ITリテラシー**: LINEは使える、ブラウザの翻訳機能は知らない
- **視力**: 老眼あり、小さい文字は読みにくい（14px以上推奨）
- **操作**: タップは1本指、長押し・ドラッグは苦手
- **心理**: 不安が強い、専門用語は怖い、温かい言葉が欲しい
- **健康状態**: 慢性疾患を1つ以上抱えている

### UI/UX設計原則
1. **文字は大きく**: 最小12px、本文14px以上
2. **ボタンは大きく**: タップ領域44px以上
3. **操作は1タップ**: 長押し・ドラッグ不要
4. **専門用語を避ける**: 「SaMD」→使わない、「PEM」→「活動後の倦怠」
5. **色のコントラスト**: 薄いグレーの文字を避ける
6. **リンクは自動翻訳**: ユーザーの言語でページが開く
7. **エラーは優しく**: 技術用語なし、「もう一度お試しください」
8. **初回は手取り足取り**: 何をすればいいか3ステップで示す
9. **不安を消す**: ディスクレーマーは必要だが、脅さない表現で
10. **継続の動機**: 小さな改善を可視化し、希望を持たせる
