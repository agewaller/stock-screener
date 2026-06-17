# シーケンス: 写真アップロード + AI 2-pass 分析

FN-DIARY-02 (写真カテゴリ) + FN-AI-04 (画像解析)。[ADR-0007](../../adr/0007-browser-pii-prohibition.md) (画像も PII) を厳守。

```mermaid
sequenceDiagram
    autonumber
    actor U as ユーザ
    participant B as ブラウザ<br/>(PhotoUploadForm)
    participant FB as Firebase JS SDK
    participant API as Hono API
    participant GCS as Cloud Storage<br/>(cares-photos-dev)
    participant DB as Cloud SQL
    participant ANT as Anthropic Claude

    U->>B: 写真選択 (input type=file)
    B->>B: compressJpeg()<br/>長辺 1600px + JPEG@0.85<br/>(EXIF も自動削除)
    Note over B: Blob のみ保持、base64 化しない<br/>localStorage / IndexedDB に絶対書かない

    B->>FB: getIdToken() (fresh)
    FB-->>B: ID token

    B->>API: POST /api/photos/upload-url<br/>Bearer idToken<br/>{contentType, sizeBytes, capturedAt}
    API->>DB: prisma.photo.create<br/>status: "draft"
    API->>GCS: signPutUrl(objectPath, contentType, 15min)
    GCS-->>API: v4 Signed PUT URL
    API-->>B: {photoId, signedPutUrl, expiresAt}

    B->>GCS: PUT {signedPutUrl}<br/>Content-Type: image/jpeg<br/>body: Blob<br/>(Authorization 不要)
    Note over B,GCS: ブラウザ → GCS 直接<br/>API は経由しない (帯域節約)
    GCS-->>B: 200 OK

    B->>API: POST /api/photos/:id/complete<br/>Bearer idToken
    API->>GCS: objectExists(path)<br/>(実体確認)
    GCS-->>API: true
    API->>DB: prisma.photo.update<br/>status: "ready"
    API-->>B: 200 OK
    API->>API: fire-and-forget<br/>analyzePhoto(photoId)

    par AI 2-pass 分析 (バックグラウンド)
        API->>DB: getMonthlyCostJpy(userId)
        DB-->>API: 月次累計
        alt 月次キャップ超過
            API->>DB: prisma.photo.update<br/>aiError: "quota_exceeded"
        else 通常
            API->>GCS: downloadObject(path)
            GCS-->>API: Buffer
            API->>API: base64 化 (server 内のみ)

            Note over API,ANT: pass1: 分類 (Haiku 固定)
            API->>ANT: messages.create<br/>model: claude-haiku-4-5<br/>system: inline_image_classify<br/>content: [image, text]
            ANT-->>API: {image_type: "food"}<br/>(JSON in code block)
            API->>DB: recordUsage (pass1)

            API->>DB: 再度 quota チェック
            alt 超過
                API->>DB: aiError: "quota_exceeded_after_pass1"<br/>photoType: imageType
            else 通常
                Note over API,ANT: pass2: 詳細分析 (user-selected model)
                API->>ANT: messages.create<br/>model: claude-sonnet-4-6 等<br/>system: inline_image_food (例)
                ANT-->>API: 構造化栄養情報 JSON
                API->>DB: recordUsage (pass2)

                Note over API,DB: 自動関連付け
                API->>DB: prisma.meal.findFirst<br/>where: {userId, eatenAt: ±1h}
                DB-->>API: Meal row or null
                API->>DB: prisma.photo.update<br/>photoType, aiClassification,<br/>relatedCategory, relatedRecordId,<br/>aiAnalyzedAt
            end
        end
    and ユーザのポーリング
        loop 最大 30s
            B->>API: GET /api/records/photo/:id<br/>Bearer idToken
            API->>DB: prisma.photo.findFirst
            DB-->>API: Photo row
            API-->>B: photo (aiAnalyzedAt や aiError をチェック)
        end
    end

    B->>B: 結果表示<br/>分類タグ + 構造化詳細
```

## ポイント

- **Signed URL 直接 PUT** で ブラウザ → GCS。サーバを介さず帯域効率良い + 大きい画像でも API 負荷ゼロ
- **EXIF 自動削除**: `createImageBitmap` + `drawImage` (Canvas) で再描画すると EXIF は保持されない (位置情報 / 撮影日時 / 機種が削除される)
- **base64 はサーバ内のみ**: クライアントは Blob のまま GCS に PUT、API が Anthropic Vision に投げる時だけサーバで base64 化
- **2-pass パイプライン**: pass1 で `image_type` を Haiku 軽量分類 → pass2 で type 別の専用プロンプト (`inline_image_food` 等) を user-selected model で詳細分析。旧 stock-screener のパターン継承
- **月次キャップ尊重 (BR-20)**: pass1 前と pass2 前の両方で `getMonthlyCostJpy()` チェック。超過時は分析スキップして写真自体は保存 (`aiError` だけ記録)
- **自動関連付け**: `image_type==="food"` → ±1h 以内の Meal record と link、`blood_test` → ±1d 以内の BloodTest、etc.
- **表示時は Signed GET URL (5 min)**: 別シーケンス。`PhotoCard` コンポーネントが `URL.createObjectURL(blob)` で blob URL 化 → unmount で `revokeObjectURL`
- **削除時の GCS 同期**: ソフト削除すると `bucket.file().move()` で `deleted/` prefix に rename → 30 日後 lifecycle で物理削除 (フェイルセーフ)

## 実装参照

- `apps/web/lib/photo-upload.ts` — compressJpeg + putToSignedUrl
- `apps/web/components/PhotoUploadForm.tsx` — UI + 分析ポーリング
- `apps/web/components/PhotoCard.tsx` — 表示 (blob URL → unmount revoke)
- `apps/api/src/index.ts` — 4 endpoints (`/api/photos/upload-url`, `/:id/complete`, `/:id/signed-url`, `GET /api/photos`)
- `apps/api/src/gcs.ts` — Signed URL ヘルパー + GCS object 操作
- `apps/api/src/photo-analyzer.ts` — 2-pass パイプライン + 自動関連付け
