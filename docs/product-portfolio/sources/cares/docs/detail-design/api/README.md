# API 仕様

新仕様 cares が公開する HTTP API（Hono on Cloud Run）の仕様。

| ファイル | 内容 |
|---|---|
| [api-list.md](api-list.md) | 全エンドポイントの一覧と仕様（人間用） |
| [openapi.yaml](openapi.yaml) | OpenAPI 3.1 仕様（機械可読） |

## 前提

- ベース URL: `https://api.cares.advisers.jp`（prod） / `staging-api.cares.advisers.jp`（staging）/ `dev-api.cares.advisers.jp`（dev）
- フレームワーク: **Hono on Cloud Run**（[ADR-0004](../../adr/0004-backend-stack-typescript-hono-prisma.md)）
- 認証: GCP Identity Platform (Firebase Auth) 発行の **Firebase ID token** を `Authorization: Bearer ...` で受け取り、`firebase-admin` の `verifyIdToken` で検証（[ADR-0014](../../adr/0014-auth-switch-to-identity-platform.md)）。Web 側は Auth.js v5 Credentials provider が HttpOnly cookie `authjs.session-token` に格納
- バリデーション: **Zod**（リクエスト・レスポンスの両方）
- レスポンス形式: 原則 JSON、AI ストリーミングのみ **SSE (text/event-stream)**
- エラー形式: `{ "error": { "code": "...", "message": "...", "details": {...} } }`
- ID: UUID v4
- 日時: ISO 8601（UTC、`Z` suffix）

## 認証パターン

1. **未認証可エンドポイント**: ヘルスチェック等のみ
2. **認証必須**: ほとんどのエンドポイント。Firebase ID token を検証し、`prisma.user.upsert({ where: { globalUid } })` で `users.id` を解決（初回ログインで自動 provision、`user_link` は廃止）
3. **管理者必須**: 三段フェイルセーフ（[ADR-0011](../../adr/0011-admin-model-with-failsafe.md)）

## ステータスコード規約

| コード | 用途 |
|---|---|
| 200 | 成功 |
| 201 | 作成成功 |
| 204 | 成功・本文なし（DELETE 等） |
| 400 | リクエスト形式不正（Zod 検証エラー含む） |
| 401 | 未認証 |
| 403 | 認可なし（admin 必要等） |
| 404 | リソース未存在 |
| 409 | 競合（同日 deep 解析、重複等） |
| 422 | ビジネスルール違反（コストキャップ超過等） |
| 429 | レート制限超過 |
| 500 | サーバ内部エラー |

## 関連 ADR

- [ADR-0014](../../adr/0014-auth-switch-to-identity-platform.md): 認証基盤（Identity Platform / Firebase Auth + Auth.js v5）
- [ADR-0004](../../adr/0004-backend-stack-typescript-hono-prisma.md): Hono / REST / OpenAPI / Zod
- [ADR-0006](../../adr/0006-ai-provider-strategy.md): AI API 仕様
- [ADR-0007](../../adr/0007-browser-pii-prohibition.md): `/api/cache-key`, `/api/drafts`
