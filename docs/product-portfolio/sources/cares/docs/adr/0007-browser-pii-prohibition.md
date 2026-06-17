# ADR-0007: ブラウザに PII を置かない原則 + IndexedDB 暗号化キャッシュ

- Status: Accepted
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）

## Context

旧仕様は localStorage を「正本兼キャッシュ」として使い、ユーザーの健康記録・AI 会話履歴・プロファイル情報すべてを平文で保存していた。これは Firebase の起動コスト・離脱時のデータ保全に貢献していた一方、共有 PC・ブラウザ拡張機能・マルウェアの passive read という脅威に対して脆弱だった。

ユーザーから明示的に「PII や日記テキストなどは他人から見ることが出来ないようにしたい」という方針が提示された（論点 7）。

## Decision

### 基本原則

**ブラウザのディスクストレージに PII / 医療データ / 日記テキストを置かない。**

### ストレージ別の取り扱い

| ストレージ | 取り扱い |
|---|---|
| **localStorage** | **PII 完全禁止**。UI 設定（テーマ・言語等の非個人情報）のみ可 |
| **sessionStorage** | **PII 完全禁止**（一貫性のため localStorage と同等扱い） |
| **IndexedDB** | **暗号化（AES-GCM）したうえで、一時キャッシュとしてのみ許容** |
| **In-memory（React state）** | OK（リロードで消える） |
| **Cookie** | セッショントークンは **HttpOnly + Secure + SameSite=Strict** のみ。PII テキスト不可 |
| **Service Worker キャッシュ** | アプリシェルのみ。PII を含む HTML やデータは **絶対にキャッシュしない** |
| **ブラウザの HTTP キャッシュ** | PII を含む HTML / JSON レスポンスは `Cache-Control: no-store` で禁止 |

### データ種別ごとの扱い

| データ種別 | 扱い |
|---|---|
| 健康日記テキスト | IndexedDB 暗号化キャッシュ可、表示中はメモリ |
| 画像（食事・検査結果・処方箋等） | **画像データも PII**。Signed URL で都度フェッチ、blob URL で表示、メモリのみ、IndexedDB にもキャッシュしない |
| AI 会話 | IndexedDB 暗号化キャッシュ可、表示中はメモリ |
| 監査ログ表示（自分への監査） | **PII 扱い**。表示中メモリのみ、IndexedDB にもキャッシュしない（次回開いた時は API 再取得） |
| ユーザープロファイル（氏名・年齢・薬等） | 表示中メモリ + 短時間 IndexedDB 暗号化キャッシュ可 |

### SSR / HTML キャッシュ方針

Next.js App Router で SSR された **HTML に PII が含まれる場合**:

- レスポンスヘッダで `Cache-Control: no-store, must-revalidate` を必ず付与
- Service Worker のキャッシュ戦略から完全に除外
- 「ログイン後の任意ページ」は基本的に PII を含むと見なし no-store
- 「ログイン前のページ（トップ、ログイン画面、利用規約）」のみキャッシュ可

### IndexedDB 暗号化キャッシュの仕様

| 項目 | 採用 |
|---|---|
| 暗号鍵戦略 | **セッションバウンド鍵**（ログイン直後にサーバから払い出し、メモリ + IDB メタに保持、ログアウトで完全破棄） |
| キャッシュ範囲 | **最小**（現在表示中 / 直近閲覧のみ）。「戻るボタンが速い」程度 |
| TTL | **セッション中のみ**。タブ閉じる / ログアウトで完全削除 |
| 暗号方式 | Web Crypto API（SubtleCrypto）AES-GCM |
| 鍵払い出し API | `/api/cache-key`（ログイン直後に呼ぶ、レスポンスはメモリのみ保持） |

### PWA オフライン体験

- アプリシェル（HTML/CSS/JS）のみオフラインキャッシュ
- ユーザーデータはオンライン必須
- オフライン時は「接続を回復してください」表示

### フォームドラフト

- **サーバ側 `drafts` テーブルに数秒ごと autosave**
- ブラウザストレージへの autosave は禁止

## Consequences

### 良い面

- 共有 PC・ブラウザ拡張機能・マルウェアの passive read 攻撃から PII を防護
- データ主権原則の最強の実装形態
- 「他人にバレない」ユーザーの安心感
- 監査ログ（ADR-0011 / 論点 11）と組み合わせて、データアクセスを完全に把握可能

### 悪い面

- 真のオフラインモードが不可能（電波の悪い場所では日記閲覧不可）
- 初回ページ表示が遅い（localStorage キャッシュからの瞬時表示は使えない）
- 「ユーザーが入力中の長文がリロードで消える」リスク（→ サーバ autosave で対策）
- 実装複雑度の増加（IndexedDB 暗号化、鍵管理、Service Worker との整合）

### 派生タスク

- CI で localStorage / sessionStorage への PII 書き込みを静的検査で禁止
- `/api/cache-key` の実装とセキュリティレビュー
- IndexedDB 暗号化ラッパーの実装（`packages/shared` 等に共通化）
- ログアウト時のキャッシュ完全削除フローのテスト
- ユーザー説明ドキュメント（「なぜオフラインで使えないか」の説明）

## Alternatives Considered

- **旧仕様継続（localStorage に全部置く）**: 動機（データ主権）と矛盾。
- **localStorage 完全禁止、IndexedDB も禁止（メモリのみ）**: 最も厳格だが、「戻るボタンが遅い」「ページ遷移ごとに再 fetch」など UX が大きく劣化。
- **localStorage は禁止だが IndexedDB は平文 OK**: 一貫性に欠ける。「ブラウザの永続ストレージは信頼しない」原則を貫けない。
- **ユーザーパスフレーズ派生鍵**: サーバ侵害でも復号不可だが、Magic Link / Google OAuth と相性悪く、高齢ペルソナに UX 負担。
- **暗号化なしで IndexedDB を使う**: passive read 攻撃に対して脆弱。原則違反。

## 補記: 写真機能の実装ガイド (2026-05-26 追記)

写真機能 (`/record/photo`、FN-DIARY-02、`infra/gcs.md` 参照) では本 ADR を以下の通り遵守:

- 表示用 Signed URL は **GET 5 min 有効** (`GET /api/photos/:id/signed-url`)、レスポンスに `Cache-Control: no-store` を付与
- 画像 fetch は **必ず `cache: "no-store"`** で行う (browser HTTP cache に画像を残さない)
- 取得した blob は `URL.createObjectURL(blob)` で blob URL 化 → `<img>` で表示 → unmount で `URL.revokeObjectURL`
- **IndexedDB / localStorage / sessionStorage には絶対書かない** (Firebase Auth が使う IndexedDB の `firebaseLocalStorageDb` だけは認証 refresh token 用、画像系とは別)
- アップロード時の base64 化はサーバ内のみ (Claude vision API に投げる時)。クライアントは Canvas で再描画した Blob を直接 GCS に PUT する (base64 を経由しない)
- Service Worker は現状未導入。将来 SW を入れる際は `/api/photos/*` と GCS signed URL を SW cache から**完全除外**する設定が必要 (TODO)
