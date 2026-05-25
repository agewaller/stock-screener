# API 一覧

健康日記システムが利用する API（Cloudflare Worker / Firebase）の as-built 仕様。

## 1. Cloudflare Worker API

### 1.1 stock-screener Worker（`worker/anthropic-proxy.js`）

実体は `cares-relay` Worker（`ai.cares.advisers.jp`）が service binding で前段に立ち、CORS / Origin 検証はこの Worker で行う。

#### `POST /v1/messages`

Anthropic Messages API のプロキシ。Stream 対応。

**リクエスト**
```http
POST /v1/messages HTTP/1.1
Host: ai.cares.advisers.jp
Origin: https://cares.advisers.jp
Content-Type: application/json
anthropic-version: 2023-06-01

{
  "model": "claude-opus-4-6",
  "max_tokens": 4096,
  "messages": [
    { "role": "user", "content": "..." }
  ],
  "stream": true
}
```

**処理**
1. Origin が許可リストに含まれることを検証
2. KV `admin:key:anthropic` または env `ANTHROPIC_API_KEY` から API 鍵を取得
3. `x-api-key` ヘッダを上書きして Anthropic API に転送
4. レスポンスをそのまま素通し（stream 時は SSE）

**レスポンス**
- 200: Anthropic からのレスポンス（JSON or SSE）
- 400: リクエスト形式不正
- 403: Origin 不一致
- 502: 上流エラー
- 529: Anthropic 過負荷（フォールバック対象）

---

#### `POST /v1/ai`

汎用 AI 呼び出し。Anthropic 以外のプロバイダ用。

**リクエスト**
```json
{
  "provider": "openai" | "google",
  "model": "gpt-4o" | "gemini-2.5-pro",
  "messages": [...]
}
```

**処理**
- `provider` に応じて OpenAI / Google AI のエンドポイントに転送
- 各プロバイダの API 鍵を KV から注入
- レスポンスは正規化された `{ text: string }` で返す

---

#### `POST /admin/keys`

API 鍵を Cloudflare KV に保存する。管理者専用。

**リクエスト**
```http
POST /admin/keys HTTP/1.1
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json

{
  "keys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-...",
    "google": "..."
  }
}
```

または鍵クリア:
```json
{ "clear": true }
```

**認証**: 以下のいずれか
- Firebase ID Token が JWKS 検証を通り、`email == agewaller@gmail.com` かつ `email_verified` が `false` でないこと
- `x-admin-token: <ADMIN_WRITE_TOKEN>`（break-glass）

**処理**: KV `admin:key:<provider>` に書き込み（または削除）

**レスポンス**
- 200: `{ ok: true }`
- 401: 認証エラー
- 403: 認可エラー（管理者でない）

---

#### `GET /admin/key-status`

API 鍵の設定状況を返す。**鍵値は絶対に返さない**。

**リクエスト**
```http
GET /admin/key-status HTTP/1.1
Authorization: Bearer <Firebase ID Token>
```

**レスポンス**
```json
{
  "anthropic": true,
  "openai": false,
  "google": true
}
```

---

### 1.2 cares-relay Worker（`worker/relay.js`）

`ai.cares.advisers.jp` を受け、service binding `env.PROXY` で `stock-screener` Worker に転送するのみ。Cloudflare Access 保護をバイパスする目的。

すべての URL パスが透過的に転送される。

---

### 1.3 plaud-inbox Worker（`worker/plaud-inbox.js`）

Cloudflare Email Routing からのみ呼び出される。HTTP エンドポイントなし。

**処理フロー**
1. メール送信先 `plaud-{hash}@inbox.cares.advisers.jp` または `data-{hash}@...`
2. 局所部から `kind`（`plaud` or `data`）と `hash` を抽出
3. メール本文をパース・サニタイズ
4. Firestore `inbox/{hash}/{kind}/{messageId}` に `setDoc`
   ```json
   {
     "hash": "{hash}",
     "kind": "{plaud|data}",
     "text": "<メール本文 ≤ 200KB>",
     "processed": false,
     "receivedAt": <Timestamp>,
     "source": "<From アドレス>"
   }
   ```

---

### 1.4 professional-mailer Worker（`worker/professional-mailer.js`）

専門家への問い合わせメール送信。

**リクエスト**（推定）
```json
{
  "to": "doctor@example.com",
  "subject": "...",
  "body": "...",
  "userContext": "..."
}
```

**認証**: Firebase ID Token

**処理**: Resend または SendGrid API でメール送信

---

### 1.5 research-updater Worker（`worker/research-updater.js`）

cron トリガで研究データを更新し KV に保存。HTTP エンドポイントなし。

---

### 1.6 learning-orchestrator Worker

別プロダクト（jsrm 系）用。本書スコープ外。

---

## 2. Firebase API

### 2.1 Firebase Authentication（クライアント SDK）

ブラウザから直接呼ぶ。

| メソッド | 用途 |
|---|---|
| `signInWithRedirect(GoogleAuthProvider)` | Google OAuth ログイン |
| `getRedirectResult()` | リダイレクト復帰時に呼ぶ |
| `signInWithEmailAndPassword(email, password)` | Email/Password ログイン |
| `createUserWithEmailAndPassword(...)` | 新規登録 |
| `signInAnonymously()` | 匿名ゲストログイン |
| `signOut()` | ログアウト |
| `onAuthStateChanged(callback)` | セッション変化監視 |
| `currentUser.delete()` | アカウント削除（退会） |
| `currentUser.getIdToken()` | ID Token 取得（Worker 認証用） |

### 2.2 Firestore（クライアント SDK）

| メソッド | 用途 | 例 |
|---|---|---|
| `getDoc / setDoc / updateDoc / deleteDoc` | 単一ドキュメント操作 | `setDoc(doc(db, 'users', uid), {...})` |
| `addDoc` | サブコレクションにドキュメント追加（自動 ID） | `addDoc(collection(db, 'users/{uid}/symptoms'), {...})` |
| `getDocs(query)` | クエリで複数取得 | |
| `onSnapshot(query, cb)` | リアルタイム subscribe | `onSnapshot(collection(...), snap => ...)` |
| `query / where / orderBy / limit` | クエリ構築 | |

### 2.3 主要 Firestore パス

| パス | 用途 |
|---|---|
| `users/{uid}` | ユーザプロファイル |
| `users/{uid}/symptoms/{id}` | 症状記録 |
| `users/{uid}/vitals/{id}` | バイタル |
| `users/{uid}/medications/{id}` | 服薬 |
| `users/{uid}/meals/{id}` | 食事 |
| `users/{uid}/sleepData/{id}` | 睡眠 |
| `users/{uid}/bloodTests/{id}` | 血液検査 |
| `users/{uid}/photos/{id}` | 写真 |
| `users/{uid}/textEntries/{id}` | テキストメモ |
| `users/{uid}/analysisHistory/{id}` | AI 解析履歴 |
| `users/{uid}/deepAnalyses/{id}` | 本格解析 |
| `users/{uid}/doctorReports/{id}` | 医師提出レポート |
| `users/{uid}/conversationHistory/{id}` | チャット履歴 |
| `users/{uid}/plaudAnalyses/{id}` | Plaud 解析 |
| `users/{uid}/apiUsage/{id}` | AI 利用ログ |
| `admin/{docId}` | 管理者設定 |
| `inbox/{hash}/plaud/{messageId}` | Plaud 受信生データ |
| `inbox/{hash}/data/{messageId}` | data 受信生データ |
| `prompts/{key}` | プロンプトテンプレート |
| `prompts/{key}/versions/{version}` | プロンプト履歴 |
| `aiModes/{key}` | AI モード設定 |
| `auditLogs/{id}` | 監査ログ |
| `safetyEvents/{id}` | セーフティイベント |

---

## 3. 外部 API

### 3.1 NCBI PubMed E-utilities

ブラウザから直接呼ぶ（CORS 許可、無認証）。

| エンドポイント | 用途 |
|---|---|
| `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmax=10` | PMID 検索 |
| `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={pmids}` | メタデータ取得 |

**注意**: NCBI のソフト制限は約 3 req/s/IP。キャッシュ・レート制御はクライアント側未実装。

### 3.2 AI プロバイダ（Worker 経由）

| プロバイダ | エンドポイント（Worker が呼ぶ） |
|---|---|
| Anthropic Claude | `https://api.anthropic.com/v1/messages` |
| OpenAI | `https://api.openai.com/v1/chat/completions` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |

ブラウザは Worker 経由でのみ呼び出し、API 鍵を持たない。

### 3.3 Fitbit / Google Calendar

OAuth2 でユーザがアプリ認証 → トークンを localStorage に保管 → ブラウザから直接呼び出し。

---

## 4. 認証・認可マトリクス

| API | 認証方式 | 認可 |
|---|---|---|
| `POST /v1/messages` | Origin チェック | — |
| `POST /v1/ai` | Origin チェック | — |
| `POST /admin/keys` | Firebase ID Token または `x-admin-token` | `email == agewaller@gmail.com` |
| `GET /admin/key-status` | 同上 | 同上 |
| `professional-mailer` | Firebase ID Token | 認証ユーザ全員 |
| Firestore `users/{uid}/*` | Firebase Auth | 本人のみ R/W、管理者は R |
| Firestore `admin/*` | Firebase Auth | 管理者のみ R/W |
| Firestore `inbox/{hash}/*` | Firebase Auth | hash 一致時に R、未認証で create 可（Worker 用） |
| Firestore `prompts/*` | — | 公開 R、管理者 W |

---

## 5. レートリミット

| 対象 | 制限 |
|---|---|
| AI 呼び出し（クライアント側タイムアウト） | 1 回 30 秒、全体 55 秒 |
| 本格的な深堀解析 | ユーザあたり 1 日 1 回 |
| Worker → Anthropic | Anthropic 側のレート（プランによる） |
| PubMed | NCBI 側 約 3 req/s/IP（クライアント側で制御なし） |
