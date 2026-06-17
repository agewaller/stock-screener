# インタビュー記録（要件再定義 / フェーズ 1）

本文書はユーザーとのインタビュー結果を **論点単位で蓄積** するライブ文書。確定した内容は順次 `requirements/` 配下の正式文書（要件定義書 v2 等）に転記する。

- 形式: 論点ごとに「自由記述 → 選択肢回答 → 確定事項 → 派生論点」の構造で記録
- 状態: `[確定]` / `[暫定]` / `[未確定]`

---

## 論点 1: アーキテクチャ転換の動機  [確定]

### ユーザー自由記述（原文）

Firebase を使ったことによる限界は以下:

- 病気など個人的な情報を書き込むため、将来的なことも考慮して Firebase ではなく自前でデータ管理ができる DB サーバが適切と考える
- Firestore などのコレクション・ドキュメント構造が使いづらい。RDBMS で適切なテーブル設計をして運用したい
- Firebase のパフォーマンスの限界。RDBMS と自作 WEB API を開発することでパフォーマンスを将来的にコントロールしたい

### カテゴリ別マッピング（複数該当）

| カテゴリ | 該当 | 備考 |
|---|---|---|
| 運用 / オブザービリティ / データ主権 | **最優先** | 個人情報を自前管理するという中核要請 |
| コード品質 / 保守性 | 該当 | RDBMS による型安全・テーブル設計 |
| 事業 / スケール | 該当 | パフォーマンス制御権、将来のスケール対応 |
| 機能 / AI 表現力 | 該当 | SQL 集計、RAG 等の将来機能 |

### 派生論点（後続の前提となる事項）

- **SSO 要件 [新規]**: 健康日記単独ではなく、ValuationMatrix / zen-track 等の自社サービス群と **共通アカウントで利用できる設計** を初期から組み込む。
  → 論点 2（認証方式）の前提条件。

### 設計上の含意

- データは GCP 上の自社管理 DB（PostgreSQL）に格納する。Firestore からの完全脱却。
- 認証は最初から SSO 前提。後付けではなく初期設計に組み込む。
- 個人情報の保管場所・暗号化・アクセスログを設計初期から要件化する。
- パフォーマンス制御権を持つため、API・DB・キャッシュレイヤーを自前で設計する。

---

## 論点 2: 認証方式の選定  [確定]

### 前提

論点 1 の派生として **SSO Lv2（中央 IdP + フェデレーション）** が要件。健康日記単独ではなく、ValuationMatrix / zen-track 等の自社サービス群で **ユーザー ID を共通化**、共通プロファイル・共通サブスクリプションを可能にする設計。

### 既存サービスの認証状況（インタビュー回答）

- **ValuationMatrix**: GCP Identity Platform + Google アカウントログイン（運用中）
- **zen-track**: 未着手（これから開発）

### 確定事項

#### 認証アーキテクチャ

- **中央 IdP**: Keycloak セルフホスト on GCP（独立した GCP プロジェクト `identity` を新設）
- **各サービス**: cares / ValuationMatrix / zen-track は **OIDC RP** として中央 IdP に接続
- **GCP プロジェクト分離**: サービスごとに別 GCP プロジェクト（コスト・障害隔離・権限分離のため）
- **ユーザー ID モデル**:
  - 中央 IdP が `global_uid`（OIDC `sub` クレーム）を発行
  - 各サービス DB には `user_link (global_uid, local_user_id)` を持ち、サービス内部 ID とは分離
  - 共通プロファイル（氏名・メール等）は中央 IdP 側で一元管理

#### サポートするログイン手段

| 手段 | 採用 | 備考 |
|---|---|---|
| Google ログイン | 必須 | スタンダード、既存 ValuationMatrix ユーザーとの互換性 |
| Email + Password | 採用 | Google アカウントを持たない高齢ユーザー向け |
| Magic Link（メールリンク） | 採用 | パスワード管理が苦手なユーザー向け、高齢ユーザーに優しい |
| **匿名認証** | **採用（SSO 圏外）** | 匿名利用可能だが、その方法でログインしたユーザーは SSO 機能・サービス間連携を使えない。あとから正規アカウントへ昇格できる導線を設計 |

#### 2FA

- **ユーザー任意で有効化可能**（TOTP: Google Authenticator 等）
- 全ユーザー必須ではない（65 歳ペルソナを考慮）
- 管理者アカウントは別途強制を検討（論点 11 で詰める）

### 設計上の派生タスク

- **ValuationMatrix の移行計画**: 現状 Identity Platform 直接利用 → 中央 IdP 経由の OIDC RP に切替。これは cares プロジェクト外だが、SSO 実現のため必須。**現プロジェクトのスコープか別プロジェクトかを後で確認** が必要。
- **匿名 → 正規アカウントの昇格フロー**: 匿名で蓄積したデータを正規アカウントに引き継ぐ UX 設計（論点 7 / 10 と連動）
- **Keycloak 運用設計**: バックアップ、DR、可用性、バージョンアップ運用（論点 5 / 12 で詰める）
- **トークン仕様**: 各サービス側のセッション形式（JWT 検証のみ / 自前セッション発行）、リフレッシュ戦略、ログアウト伝播（Backchannel logout）

---

---

## 論点 3: フロントエンド技術選定  [確定]

### 前提

- 現行は vanilla JS + 13 モジュール SPA。コード品質・保守性の限界が動機の一つ。
- ValuationMatrix の FE スタックは未定（揃える制約なし。cares で最良の選択をし、後から VM を寄せる発想）。
- 重視軸: **生産性・エコシステム**

### 確定事項

| 項目 | 採用 |
|---|---|
| 言語 | TypeScript |
| フレームワーク | **Next.js (App Router / SSR 中心)** |
| UI | **Tailwind CSS + shadcn/ui** |
| PWA | **継続**（Service Worker / オフライン読み込み / ホーム画面追加） |
| ホスティング | Cloud Run（SSR をコンテナで運用、論点 5 で詰める） |

### 設計上の含意・派生タスク

- **App Router + RSC（React Server Components）**: DB に近い計算をサーバで実行、ブラウザに送るデータを最小化（データ主権の方針と整合）
- **PWA 実装**: Next.js App Router と Service Worker の相性に注意。`serwist` 等のライブラリ採用を想定
- **アクセシビリティ**: 65 歳ペルソナを考慮。shadcn/ui は Radix UI ベースで a11y 良好だが、フォントサイズ・コントラスト・タップ領域のデフォルト調整を要件化
- **i18n**: 現行は独自実装。Next.js では `next-intl` 等の標準ライブラリ採用を検討（論点未開拓）
- **状態管理**: 後段で必要に応じて Zustand / TanStack Query を検討（現時点では未確定）

---

## 論点 4: バックエンド技術スタック選定  [確定]

### 前提

- FE は TypeScript + Next.js（論点 3）
- 重視軸: 生産性・エコシステム
- AI API 統合（Anthropic / OpenAI / Gemini）が中核機能

### AI SDK 観点での言語選定

TypeScript と Python が双璧で同等の SDK 成熟度。Anthropic SDK は Node 版が新機能（prompt caching、tool use、batch、extended thinking）を先行リリースする傾向で TypeScript が微優位。Go / JVM 系は SDK 追従が遅く除外。

### 確定事項

| 項目 | 採用 |
|---|---|
| 言語 | **TypeScript / Node.js** |
| FE/BE 境界 | **分離**（Next.js FE/BFF + 別 BE API on 別 Cloud Run サービス） |
| BE フレームワーク | **Hono**（軽量・Cloud Run と相性良し） |
| API スタイル | **REST + OpenAPI + Zod**（FE/BE で型を Zod 経由で共有、外部公開・SDK 生成も可） |
| ORM / DB アクセス | **Prisma**（シェア最大、ドキュメント・マイグレーションツール強力） |
| Python の扱い | **MVP では不採用**。将来 ML/RAG が必要になったら Cloud Run マイクロサービスまたはワーカーとして後追加（パターン B/C） |

### 設計上の含意

- FE/BE が同じ TypeScript なので **Zod スキーマを `packages/shared` 等で共有** する設計に
- BE は `packages/api` (Hono) / FE は `apps/web` (Next.js) のような **モノレポ構造** が自然（Turborepo / pnpm workspaces）
- Prisma のスキーマファイル `schema.prisma` が DB の正本となる。マイグレーションは Prisma Migrate で管理
- AI 統合は BE 側に集約（Anthropic / OpenAI / Gemini の SDK は BE のみで使う、ブラウザに鍵を出さない原則を維持）

---

## 論点 5: GCP サービス選定 / 環境戦略  [確定（細部は要レビュー）]

### 確定事項（コアサービス）

| カテゴリ | 採用サービス |
|---|---|
| コンピュート | **Cloud Run**（FE / BE / Keycloak すべて） |
| RDB | **Cloud SQL for PostgreSQL** |
| キャッシュ | **採用しない（MVP）** — 負荷で必要になったら Memorystore for Redis |
| オブジェクトストレージ | **Cloud Storage** |
| シークレット管理 | **Secret Manager** |
| コンテナレジストリ | **Artifact Registry**（`shared` プロジェクトに集約） |
| 監視・ログ | **Cloud Logging + Cloud Monitoring**（GCP ネイティブ） |
| IaC | **Terraform** |
| CI/CD | **GitHub Actions** |
| DNS | **Cloud DNS** |

### リージョン

- **asia-northeast1（東京）** 単一リージョン
- マルチリージョン DR は MVP スコープ外。論点 12（非機能）で改めて検討

### 環境

**dev / staging / prod の 3 環境**

### GCP プロジェクト構造（service × environment）

```
cares-dev          cares-staging          cares-prod
identity-dev       identity-staging       identity-prod
vm-dev             vm-staging             vm-prod          ← 既存 VM の整理対象
zen-track-dev      zen-track-staging      zen-track-prod   ← 将来
shared                                                      ← Artifact Registry / 集約監視 / 請求集約
```

- 障害隔離・コスト可視化・権限分離が明確になる
- 数が多いが Terraform でテンプレ化すれば管理可能

### ネットワーキング

- 各環境内に **VPC を 1 つ**
- Cloud Run → Cloud SQL は **Private IP + Serverless VPC Access**
- Cloud SQL の Public IP は無効化
- 環境間（dev/staging/prod）は完全分離

### 設計上の含意・派生タスク

- **AlloyDB への将来移行**: ベクトル検索（pgvector）が必要になったタイミングで検討。Cloud SQL も pgvector エクステンションは利用可能なので、当面 Cloud SQL で十分
- **Keycloak の DB**: 中央 IdP プロジェクト `identity-*` 内に専用の Cloud SQL インスタンス
- **シークレット**: AI API キー、Keycloak admin、Prisma DATABASE_URL 等は Secret Manager 経由でアプリへ注入

---

## 論点 6: AI 鍵管理・AI 経路  [確定]

### 確定事項

| 項目 | 採用 |
|---|---|
| 鍵保管 | **Secret Manager**（GCP）。ブラウザ・DB には絶対に置かない |
| 呼び出し経路 | **Browser → Next.js (BFF) → Hono BE → AI Providers** の単一経路 |
| 鍵注入 | アプリ起動時に Secret Manager から環境変数 / Workload Identity 経由で取得 |
| サポート Provider | **Anthropic / OpenAI / Gemini の 3 社**（現仕様継続） |
| デフォルトモデル | Claude Opus 系（最新の最強モデル） |
| モデル選択 UX | **ユーザー選択可**。管理者が利用可能モデル一覧を制御 |
| ストリーミング | SSE で BE → FE にストリーム（Anthropic SDK の AsyncIterator を BE 内で消費しつつ FE へ転送） |
| ローカル ML | **なし**。全て SaaS 経由 |

### コスト制御

- **ユーザー × 期間（月次）のコストキャップ** を設置
- 必要な要素:
  - 全 AI 呼び出しのトークン使用量をログ・集計（モデル別単価で換算）
  - ユーザーごとの今期使用量 / 上限を表示
  - 上限到達時の挙動: アクセス拒否 / 縮退モデルへフォールバック / 管理者通知（要設計）
  - 管理者は任意にキャップを上書き
- GCP Budgets でシステム全体の予算アラートも併用

### 設計上の含意・派生タスク

- **Anthropic 経路**: 直接 Anthropic API を叩く（Vertex AI 経由の Claude は GCP 完結だが、モデルリリース追従が遅れがちなので不採用）
- **MODEL_MAP の継続**: 旧仕様の `MODEL_MAP`（CONFIG id → API id 動的マッピング）を BE 側に移植。datestamped model id のハードコード禁止原則を継続
- **プロンプトキャッシング**: Anthropic prompt caching（5 分 TTL）を共通システムプロンプトに適用、コスト最適化
- **AI 呼び出しの監査ログ**: prompt / response をログに保存（PII マスキング後）、デバッグとコスト分析用
- **多 LLM フォールバックチェーンは作らない**: CLAUDE.md の「複雑化禁止」原則を継続。Provider ダウンは管理者が手動で切替

### Origin 許可リスト

- BE は cares の正規 Origin のみ受付。Origin 詐称攻撃を防ぐ（旧仕様の Worker と同等の保護）

---

## 論点 7: データ主権原則の継続性  [確定]

### 旧仕様 5 原則の扱い

- 第 1「すべて格納する」: **継続するが解釈を更新**。「正本は Cloud SQL に必ず格納」「ブラウザには PII を残さない」と再定義
- 第 2「いつでも個別に編集・削除」: **継続**
- 第 3「3 つの受け手向け要約」: **継続**（医師 / SNS / 近親者）。将来拡張は別途検討
- 第 4「認知を変える出力」: **継続**
- 第 5「エクスポート/ポータビリティ」: **継続**

### 新しい制約: 「ブラウザに PII を置かない」原則

旧仕様（localStorage を正本/キャッシュ両用）から大きく転換。脅威モデル: 共有 PC・ブラウザ拡張機能・マルウェアの passive read 対策。

| ストレージ | 取り扱い |
|---|---|
| **localStorage** | **PII 完全禁止**。UI 設定（テーマ・言語等の非個人情報）のみ可 |
| **sessionStorage** | **PII 完全禁止**（一貫性のため localStorage と同等扱い） |
| **IndexedDB** | **暗号化したうえで、一時キャッシュとしてのみ許容** |
| **In-memory (React state)** | OK（リロードで消える） |
| **Cookie** | セッショントークンは HttpOnly + Secure + SameSite=Strict のみ。PII テキストは載せない |

### IndexedDB 暗号化キャッシュの設計（確定）

| 項目 | 採用 |
|---|---|
| 暗号鍵戦略 | **A: セッションバウンド鍵**（ログイン直後にサーバから払い出し、メモリ + IDB メタに保持、ログアウトで完全破棄） |
| キャッシュ範囲 | **最小**（現在表示中 / 直近閲覧のみ）。「戻るボタンが速い」程度 |
| TTL | **セッション中のみ**。タブ閉じる / ログアウトで完全削除 |
| 暗号方式 | Web Crypto API（SubtleCrypto）AES-GCM |

### データ削除ポリシー

- **ソフト削除 → 30 日後にハード削除**
- 30 日以内ならユーザー本人がリストア可能
- ハード削除は復元不可能（バックアップからの復元もポリシー的に拒否）
- 「アカウント削除」も同様（30 日猶予 → 完全消去）

### エクスポート形式

| 形式 | 必須度 | 用途 |
|---|---|---|
| **JSON** | 必須 | データポータビリティの基本、API ベース |
| **CSV** | 採用 | Excel / Google スプレッドシート対応 |
| **PDF レポート** | 採用 | 医師提示用の整形済みレポート |
| **FHIR** | 採用 | 医療機関連携を見据えた国際規格 |

### 監査ログ

- **ユーザー本人にも公開**（「あなたのデータに誰がアクセスしたか」を UI で確認可能）
- 管理者アクセス・自分の API 経由アクセス・AI 解析時のデータ読み取りもすべて記録
- 表示項目: 時刻・アクセス主体（自分 / 管理者 / システム）・対象データ・操作種別（read/write/delete/export）

### PWA オフライン体験

- **アプリシェル（HTML/CSS/JS）のみオフラインキャッシュ**
- ユーザーデータはオンライン必須
- オフライン時は「接続を回復してください」表示

### フォームドラフト

- **サーバ側 `drafts` テーブルに autosave**（数秒ごと）
- オフライン時は autosave 不可 → ユーザーに警告表示
- 提出完了でドラフトは削除

### 設計上の含意・派生タスク

- **PII ガードレール**: CI で localStorage / sessionStorage への PII 書き込みを静的検査で禁止
- **鍵払い出し API**: `/api/cache-key` をログイン直後にコール、レスポンスはメモリのみで保持
- **監査ログ書き込み**: 全 BE エンドポイントで透明にログ記録（middleware で実装）
- **エクスポート実装**: PDF / FHIR は ライブラリ選定が必要（pdfkit / fhir-kit-client 等）

---

## 論点 8: マルチテナント / 法人展開  [確定]

### 軸 A: 法人展開（B2B）

**将来 B2B を見据えた設計、MVP は B2C**

- スキーマに `tenant_id` を入れて拡張余地を残す
- MVP では実質的に `tenant_id = users.id` 等の「個人テナント」
- 将来 B2B 化する際: 医療機関・介護事業者・企業が tenant として登場し、その配下にユーザーをぶら下げる構造に拡張

### 軸 B: データ共有・コラボレーション

**家族・医師との限定共有を MVP 後に実装**

- MVP: 本人と管理者のみ閲覧
- 次フェーズ: ユーザーが指定した家族 / 医師 / 介護関係者を招待 → 範囲限定・期間限定でデータ閲覧権限を付与
- 共有範囲は「特定カテゴリ（症状のみ等）」「特定期間」「読み取りのみ / コメント可」など細かく制御

### 設計上の含意・派生タスク

- **スキーマ設計の指針**:
  - 全ユーザーデータテーブルに `tenant_id` を含める
  - MVP は `tenant_id = user_id` の 1:1 紐づけだが、将来 1:N（テナント内に複数ユーザー）になる
  - データアクセスは `tenant_id` ベースの RLS（Row Level Security）かアプリ層ガードで制御
- **権限モデルの設計**（MVP 後に実装、設計はフェーズ 3 で行う）:
  - ロール: `owner` / `viewer` / `commenter` / `admin`
  - スコープ: カテゴリ別 / 期間別 / レコード別
  - 招待フロー: メール招待 + Magic Link で簡易ログイン
  - 監査ログに「誰の権限で誰のデータを見たか」を残す
- **B2B 拡張時の追加要件**（将来）:
  - 法人管理画面（テナント管理者がユーザー一覧・利用状況を見られる）
  - 法人課金（個人課金とは別）
  - SCIM 等の企業ユーザー一括プロビジョニング
  - これらは MVP では実装しない

---

## 論点 9: 外部連携の移植優先度  [確定]

### MVP 必須

| 連携 | 旧仕様 | 新仕様での実装方針 |
|---|---|---|
| **Google Calendar / ICS** | `js/calendar.js` | BE で Google Calendar API を呼び、ユーザー OAuth トークンを Secret Manager に保持。ICS 配信は BE のエンドポイント |
| **CSV エクスポート** | `js/integrations.js` | 論点 7 のポータビリティ要件と統合。BE の `/api/export/csv` で配信 |
| **専門家メール送信** | `worker/professional-mailer.js` | Cloudflare Worker → SendGrid or Cloud Run + メール送信ライブラリへ移植 |
| **Plaud（音声録音 → メール取り込み）** | `worker/plaud-inbox.js` | Cloudflare Email Worker から Google Workspace Gmail API or Pub/Sub + Cloud Run へ移行検討 |

### フェーズ 5 後半（MVP 後）

| 連携 | 用途 |
|---|---|
| Fitbit | ウェアラブル連携、OAuth + バイタル取り込み |
| Apple Health | iPhone データ取り込み（Web 連携が重め） |
| CSV インポート | 他アプリからの移行用 |

### 廃止

**なし**。すべての連携をいずれかの段階で実装する。

### 設計上の含意・派生タスク

- **Plaud のメール取り込み**: Cloudflare Email Worker は便利だが、GCP 移行する場合は SendGrid Inbound Parse / Google Workspace Gmail API / Cloud Pub/Sub のいずれか。詳細はフェーズ 3
- **OAuth トークンの保管**: Google Calendar / Fitbit の OAuth refresh token は Secret Manager または `user_oauth_tokens` テーブルに暗号化保管
- **連携モジュール化**: 各連携は `services/integrations/{provider}.ts` のような独立モジュール。サービス未設定でも本体が動く（旧仕様の「フォールバック必須」原則を継続）

---

## 論点 10: データ移行戦略  [確定（実装細部はフェーズ 6 で詰める）]

### 現状

- 既存ユーザー規模: **数人〜数十人**（個別ケア可能なサイズ）
- ドメイン: **cares.advisers.jp を継続使用**
- 移行方針: **データ・アカウントとも自動移行**

### 移行範囲

| 対象 | 旧 | 新 | 移行方法 |
|---|---|---|---|
| ユーザーアカウント（Google OAuth） | Firebase Auth | Keycloak | Keycloak の Google IdP 設定で同じ Google アカウント → シームレスログイン |
| ユーザーアカウント（Email + Password） | Firebase Auth | Keycloak | パスワードハッシュは移行困難。**JIT 移行 + 強制パスワードリセット**（初回ログイン時にメールリンクで再設定） |
| ユーザーアカウント（匿名） | Firebase Auth Anonymous | （SSO 圏外） | **個別対応 / データのみオプトイン保存**。匿名ユーザーは SSO 圏外なので、希望者には事前に正規アカウント昇格を案内 |
| 健康データ（症状・バイタル・薬・睡眠・活動・食事・血液検査・気分・写真） | Firestore | Cloud SQL (PostgreSQL) | 移行スクリプトで一括変換、新スキーマに合わせて整形 |
| AI 会話履歴 | Firestore | Cloud SQL | 同上 |
| 写真・添付 | Firebase Storage | Cloud Storage | gsutil で一括コピー、メタデータは DB に同期 |
| ユーザー設定 | Firestore | Cloud SQL `user_preferences` | 同上 |

### カットオーバー手順（案）

1. **事前準備**: 新システムを staging に立て、移行スクリプトをドライラン
2. **事前通知**: 既存ユーザーへメールで案内（移行日時、初回ログイン時のパスワードリセット手順）
3. **読み取り専用化**: 移行直前に旧 `cares.advisers.jp` を読み取り専用化（書き込みブロック）
4. **データ移行実行**: Firestore → Cloud SQL、Firebase Storage → Cloud Storage、ユーザー → Keycloak
5. **DNS 切替**: `cares.advisers.jp` を新システムに向ける
6. **旧システム保存**: `legacy.cares.advisers.jp` として 90 日間読み取り可能で残す（緊急時のフォールバック）
7. **完全終了**: 90 日後に旧システム停止、Firebase プロジェクト解約

### 設計上の含意・派生タスク

- **パスワードリセット UX**: Email + Password ユーザーは初回ログインで必ずリセットが必要。メール文面・誘導ページを丁寧に設計
- **匿名ユーザーへの個別対応**: 移行前に「正規アカウントに昇格しないとデータを失う」案内を出す
- **移行スクリプトの場所**: `apps/migration/` 等にモノレポ内で管理
- **検証**: スクリプトは staging で「本番データのコピー」を使って完全ドライラン。差分を全件比較
- **ロールバック準備**: 移行失敗時の DNS 切戻し手順を用意。Firebase 側のスナップショットを 30 日保持
- **同じドメインの SSL/SSO 影響**: cares.advisers.jp が Keycloak の認証コールバック URL になる。Keycloak の Realm 設定で許可リスト管理

---

## 論点 11: 管理者・運用  [確定]

### 管理者識別

**3 段構えのフェイルセーフ**で「オーナーを絶対にロックアウトしない」原則を担保:

1. **通常運用: Keycloak ロール `admin` で識別**
   - OIDC トークンの role claim を BE が検証
   - 複数管理者をサポート（オーナー以外にも admin 付与可）
2. **追加保険: オーナーメール強制管理者**
   - BE 側に `OWNER_EMAIL` 環境変数（`agewaller@gmail.com`）
   - OIDC `email` クレームが OWNER_EMAIL なら強制的に admin 扱い
   - Keycloak 設定ミスでロールが消えてもオーナーは入れる
3. **ブレークグラストークン**
   - 旧仕様の `ADMIN_WRITE_TOKEN` 相当を継続
   - Secret Manager に保管
   - Keycloak 完全障害時の最終手段。HTTP ヘッダ `x-admin-token` で BE を一時的に開ける

### 複数管理者

- サポート。Keycloak ロール `admin` を任意のユーザーに付与可能
- ただし `OWNER_EMAIL` のロール変更は UI からは不可（守られた状態）

### 管理者向け機能（旧仕様継続）

- プロンプト管理（CONFIG の AI プロンプトを動的編集）
- API キー管理（Secret Manager 経由、画面では「設定済み true/false」のみ表示。**鍵値は決して返さない**）
- データ管理（ユーザー一覧・個別データ閲覧・エクスポート）
- 監査ログ閲覧

### 管理操作の監査ログ

- **すべてユーザーにも公開**（「管理者があなたのデータに read/write/export した」を見せる）
- 論点 7 のデータ主権・監査ログ原則と整合

### 設計上の含意・派生タスク

- **`/admin/key-status` 仕様**: 旧仕様の「設定済み true/false のみ返す、鍵値は絶対に返さない」を継続
- **管理画面の認可ガード**: Keycloak ロール + オーナーメール + ブレークグラスの三重チェックを共通 middleware で実装
- **オーナーメールは環境変数で外出し**: `OWNER_EMAIL` を docs/ops に明記。変更は秘儀（Terraform で管理）
- **管理画面の 2FA**: 任意だが強く推奨（論点 2 で確定の 2FA を `admin` ロール持ちには強制を検討）

---

## 論点 12: 非機能要件  [確定]

### 確定事項

| 項目 | 採用 |
|---|---|
| SLA | **明示的 SLA なし、ベストエフォート**（MVP / 数十人規模） |
| データ保持 | **ユーザーが削除しない限り無期限**。ソフト削除 30日後ハード削除（論点 7 確定） |
| バックアップ | **Cloud SQL 自動バックアップ + PITR（Point-in-Time Recovery）+ 30 日保持** |
| DR | 東京リージョン内の冗長性で対応。マルチリージョン DR は将来検討 |
| コンプライアンス | **日本の個人情報保護法を遵守**（GDPR / HIPAA 相当は将来必要時に対応） |

### パフォーマンス目標（提案・暫定）

| 項目 | 目標 |
|---|---|
| 非 AI API レイテンシ | p95 < 500ms |
| AI 応答ストリーミング開始 | < 2 秒（以降は LLM 依存） |
| ページロード（LCP） | < 2.5 秒 |
| 想定ストレージ | ユーザー 1 人あたり 100MB / 月（写真込み） |

### セキュリティ要件（既論点と整合）

- **保管時暗号化**: Cloud SQL / Cloud Storage は Google 管理鍵で自動暗号化（MVP は CMEK 不要）
- **転送時暗号化**: TLS 1.2 以上必須、HSTS 有効
- **シークレット**: Secret Manager（論点 5 / 6）
- **ブラウザ PII 禁止**: 論点 7
- **監査ログ**: Cloud Audit Logs + アプリ層ログ、ユーザーにも一部公開（論点 7 / 11）

### 設計上の含意・派生タスク

- **DR テスト**: 半年に 1 回程度、PITR からのリストア演習
- **負荷想定**: 数十人規模なら Cloud Run 1 インスタンス / Cloud SQL db-f1-micro 〜 db-g1-small で十分。スケール時に随時拡張
- **GDPR 対応の準備**: スキーマと API に「データエクスポート全部」「アカウント完全削除」を最初から入れておけば、将来 EU 展開時の追加実装が最小化
- **個人情報保護法対応**: プライバシーポリシー / 利用規約 / 同意取得 UI が必要（フェーズ 5 で実装）

---

## フェーズ 1 完了

全 12 論点が確定。次工程は **フェーズ 2: アーキテクチャ設計**（コンポーネント図、データフロー、ADR の作成）。コードはまだ書かない。

