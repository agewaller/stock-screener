# ZenTrack システム設計書

## 概要

ZenTrack は Plaud デバイスからの音声録音（文字起こし）を受け取り、AI による日次分析を行い、
ユーザーが日々の活動・健康・仕事・信用・資産スコアを振り返れる Web アプリケーション。

---

## アーキテクチャ

```
[Plaud デバイス]
    │ メール送信（info+{mailAlias}@zentrack.com）
    ▼
[SendGrid Inbound Parse]
    │ POST Webhook
    ▼
[Backend: Spring Boot]  ←→  [Neon (PostgreSQL)]
    │ OpenAI API 呼び出し
    ▼
[OpenAI GPT-5.4-mini]
    │ 分析 JSON
    ▼
[daily_analysis テーブルに保存]
    ▲
    │ REST API
[Frontend: Next.js on Render]
    ▲
    │ Firebase Authentication
[ユーザー (ブラウザ)]
```

---

## インフラ

| 役割       | サービス                           |
| ---------- | ---------------------------------- |
| Frontend   | Render (Static Site / Web Service) |
| Backend    | Render (Web Service)               |
| Database   | Neon (PostgreSQL)                  |
| 認証       | Firebase Authentication            |
| メール受信 | SendGrid Inbound Parse             |
| メール送信 | SendGrid (SMTP)                    |
| AI 分析    | OpenAI API (GPT-5.4-mini)               |

---

## 認証・認可フロー

### ユーザー登録（新規）
1. `/register` ページで Google アカウントまたはメールアドレス＋パスワードで登録
2. Firebase Authentication にユーザーを作成
3. Firebase ID トークンを取得し、Backend の `POST /accounts` を呼び出してDBに保存
4. アカウント保存時に `mailAlias`（6文字のユニーク文字列）を自動生成
5. ダッシュボードにリダイレクト

### ログイン
1. `/login` ページで Google アカウントまたはメールアドレス＋パスワードでログイン
2. Firebase ID トークンを取得し Cookie に保存
3. ダッシュボードにリダイレクト

### 未ログイン時
- Next.js middleware がリクエストを検知し `/login` にリダイレクト
- `/login`・`/register` は認証不要

---

## メール受信フロー（Plaud → 日次分析）

### 設定
- SendGrid の Inbound Parse 設定でドメイン `zentrack.com` を登録
- Webhook URL: `https://api.zentrack.com/email/inbound?secret={WEBHOOK_SECRET}`

### 処理フロー
```
1. Plaud が info+{mailAlias}@zentrack.com にメール送信
2. SendGrid が POST /email/inbound にマルチパートで転送
3. EmailWebhookController が To ヘッダから mailAlias を抽出
4. mailAlias でアカウントを特定（見つからない場合は 404 を返す）
5. メール本文（text）を文字起こしとして取得
6. PromptService から最新プロンプトを取得
7. OpenAiService に文字起こし＋プロンプトを渡して分析 JSON を取得
8. DailyAnalysis エンティティに保存（targetDate = メール受信日）
```

### メールパース仕様
- `to` フィールド: `info+abc123@zentrack.com` → `abc123` を抽出
- `text` フィールド: 文字起こしテキスト（Plaud の音声認識結果）
- `subject` フィールド: 日付情報として参考利用

---

## OpenAI 分析仕様

### 入力
```
System: {最新プロンプト（Prompt テーブルの最新レコード）}
User: {Plaud からの文字起こしテキスト}
```

### 出力（JSON）
OpenAI には下記スキーマの JSON を返すよう指示する。

```json
{
  "summary": {
    "people": {
      "self_weight": 0.7,
      "identified": [
        { "name": "自分", "role": "self", "relation_temperature": "neutral", "confidence": "high" }
      ]
    },
    "context": {
      "situations_top3": ["作業", "会話", "生活行為"],
      "spaces_top3": ["家", "外", "オンライン"],
      "confidence": "high"
    },
    "health": {
      "score_0_to_5": 3,
      "calories": { "intake_kcal": 2000, "expenditure_kcal": 1800, "basal_metabolism_kcal": 1500, "balance_kcal": 200 },
      "core_metrics_coverage": { "observed": 3, "total": 5, "missing_rate": 0.4 },
      "worsening_signals": [],
      "recovery_actions": [],
      "confidence": "medium"
    },
    "time": { "score_0_to_5": 3, "confidence": "medium" },
    "time_usage": {
      "value_creation_percent": 40,
      "foundation_percent": 30,
      "maintenance_percent": 20,
      "waste_percent": 10,
      "deep_work_counts": { "25min": 2, "50min": 1, "90min": null },
      "confidence": "medium"
    },
    "work": {
      "score_0_to_5": 4,
      "positives": [],
      "blockers": [],
      "confidence": "high"
    },
    "trust": {
      "score_0_to_5": 4,
      "virtue_count": 2,
      "friction_count": 0,
      "confidence": "medium"
    },
    "assets": {
      "score_0_to_5": 3,
      "financial_flow": null,
      "systems_and_savings": null,
      "intangible_assets": [],
      "confidence": "low"
    },
    "attention_dimensions": {
      "一次元": 15, "二次元": 10, "三次元": 20, "四次元": 25, "五次元": 5
    },
    "net_value_score": 65
  },
  "timeline": [
    { "time": "07:00", "event": "起床", "category": "健康", "dimension": "一次元", "value_label": "基盤" }
  ],
  "actions_tomorrow": ["明日やること1", "明日やること2"]
}
```

---

## データモデル

### Account（既存）
| カラム       | 型         | 説明                                         |
| ------------ | ---------- | -------------------------------------------- |
| id           | UUID       | PK                                           |
| firebase_uid | VARCHAR    | Firebase UID                                 |
| email        | VARCHAR    | メールアドレス                               |
| name         | VARCHAR    | 表示名                                       |
| role         | VARCHAR    | ROLE_OPERATOR / ROLE_GENERAL                 |
| mail_alias   | VARCHAR(6) | メールプラスアドレスのエイリアス（ユニーク） |
| last_used_at | TIMESTAMP  | 最終利用日時                                 |
| is_deleted   | BOOLEAN    | 論理削除フラグ                               |
| created_at   | TIMESTAMP  | 作成日時                                     |
| updated_at   | TIMESTAMP  | 更新日時                                     |

### DailyAnalysis（新規）
| カラム            | 型        | 説明                         |
| ----------------- | --------- | ---------------------------- |
| id                | UUID      | PK                           |
| account_id        | UUID      | FK → Account.id              |
| target_date       | DATE      | 分析対象日                   |
| raw_transcription | TEXT      | Plaud からの文字起こし原文   |
| analysis_json     | TEXT      | OpenAI から返された分析 JSON |
| is_deleted        | BOOLEAN   | 論理削除フラグ               |
| created_at        | TIMESTAMP | 作成日時                     |
| updated_at        | TIMESTAMP | 更新日時                     |

### Prompt（既存）
| カラム | 型   | 説明           |
| ------ | ---- | -------------- |
| id     | UUID | PK             |
| text   | TEXT | プロンプト本文 |

---

## API エンドポイント一覧

### 認証不要
| Method | Path           | 説明                          |
| ------ | -------------- | ----------------------------- |
| POST   | /accounts      | アカウント登録                |
| POST   | /email/inbound | メール受信 Webhook (SendGrid) |

### 要認証
| Method | Path                | 説明                         |
| ------ | ------------------- | ---------------------------- |
| GET    | /accounts/me        | 自分のアカウント取得         |
| GET    | /analysis/latest    | 最新の日次分析を取得         |
| GET    | /analysis?from=&to= | 期間指定で日次分析一覧を取得 |
| GET    | /prompts/latest     | 最新プロンプトを取得         |

---

## フロントエンド画面構成

### 公開ページ（認証不要）
| パス      | 説明                                        |
| --------- | ------------------------------------------- |
| /login    | ログイン（Google / メール＋パスワード）     |
| /register | ユーザー登録（Google / メール＋パスワード） |

### 認証必須ページ
| パス      | 説明                                 |
| --------- | ------------------------------------ |
| /         | ダッシュボード（日次・推移分析）     |
| /settings | アカウント設定・メールエイリアス確認 |
| /prompts  | プロンプト管理                       |

---

## 環境変数

### Backend
| 変数名                              | 説明                                      |
| ----------------------------------- | ----------------------------------------- |
| SPRING_DATASOURCE_URL               | Neon の PostgreSQL 接続 URL               |
| SPRING_DATASOURCE_USERNAME          | DB ユーザー名                             |
| SPRING_DATASOURCE_PASSWORD          | DB パスワード                             |
| SPRING_DATASOURCE_DRIVER_CLASS_NAME | `org.postgresql.Driver`                   |
| CONFIG_FIREBASE_*                   | Firebase Admin SDK の認証情報             |
| CONFIG_MAIL_FROM_ADDRESS            | 送信元メールアドレス                      |
| CONFIG_SYSTEM_TOP_URL               | フロントエンドの URL                      |
| APP_ALLOWED_ORIGIN                  | CORS 許可オリジン（フロントエンド URL）   |
| CONFIG_OPENAI_API_KEY               | OpenAI API キー                           |
| CONFIG_OPENAI_MODEL                 | 使用モデル（例: gpt-5.4-mini）                 |
| EMAIL_WEBHOOK_SECRET                | メール Webhook の共有シークレット         |
| SPRING_MAIL_HOST                    | SMTP ホスト                               |
| SPRING_MAIL_PORT                    | SMTP ポート                               |
| SPRING_MAIL_USERNAME                | SMTP ユーザー名                           |
| SPRING_MAIL_PASSWORD                | SMTP パスワード                           |
| CONFIG_ASYNC_REGULAR_THREAD_SIZE    | 非同期処理スレッドサイズ（例: 10）        |
| CONFIG_ASYNC_STANDBY_THREAD_SIZE    | 非同期待機スレッドサイズ（例: 10）        |
| CONFIG_ENCRYPT_PASSWORD             | 暗号化パスワード                          |
| CONFIG_ENCRYPT_SALT                 | 暗号化ソルト                              |
| CONFIG_AWS_S3_ENDPOINT              | S3 エンドポイント（未使用なら任意の値）   |
| CONFIG_AWS_S3_BUCKET_NAME           | S3 バケット名（未使用なら任意の値）       |
| CONFIG_AWS_S3_ACCESS_KEY            | S3 アクセスキー（未使用なら任意の値）     |
| CONFIG_AWS_S3_SECRET_KEY            | S3 シークレットキー（未使用なら任意の値） |

### Frontend
| 変数名                                   | 説明                             |
| ---------------------------------------- | -------------------------------- |
| NEXT_PUBLIC_API_URL                      | バックエンド API URL             |
| NEXT_PUBLIC_FIREBASE_API_KEY             | Firebase Web API キー            |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         | Firebase Auth ドメイン           |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID          | Firebase プロジェクト ID         |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      | Firebase Storage バケット        |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Firebase メッセージング送信者 ID |
| NEXT_PUBLIC_FIREBASE_APP_ID              | Firebase アプリ ID               |

---

## Render デプロイ設定

### Backend (Web Service)
- **Root Directory**: `src/backend`
- **Build Command**: `./gradlew bootJar`
- **Start Command**: `java -jar -Dspring.profiles.active=dev build/libs/zentrack-0.0.1-SNAPSHOT.jar`
- **Port**: 8080

### Frontend (Web Service)
- **Root Directory**: `src/frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: 3000

---

## SendGrid Inbound Parse 設定手順

1. SendGrid ダッシュボード → Settings → Inbound Parse
2. ドメイン `zentrack.com` の MX レコードを `mx.sendgrid.net` に向ける
3. Webhook URL: `https://{BACKEND_URL}/email/inbound?secret={EMAIL_WEBHOOK_SECRET}`
4. 「POST the raw, full MIME message」をオフにする（デフォルト設定を使用）
